import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Calculate cosine similarity between two embedding vectors.
 * 
 * Cosine similarity measures the cosine of the angle between two vectors in a multi-dimensional space.
 * Returns a value between -1 and 1:
 * - 1.0: Identical vectors (same direction)
 * - 0.8-0.9: Very similar (e.g., "B2B SaaS" vs "enterprise software")
 * - 0.6-0.7: Somewhat similar
 * - 0.0: Orthogonal (unrelated)
 * - -1.0: Opposite direction
 * 
 * @param vecA First embedding vector (array of numbers)
 * @param vecB Second embedding vector (array of numbers)
 * @returns Cosine similarity score between -1 and 1, or null if invalid inputs
 */
function cosineSimilarity(vecA: number[] | null, vecB: number[] | null): number | null {
  // Handle null or undefined inputs
  if (!vecA || !vecB) {
    return null;
  }

  // Handle empty vectors
  if (vecA.length === 0 || vecB.length === 0) {
    return null;
  }

  // Handle mismatched lengths (shouldn't happen with same embedding model, but be safe)
  if (vecA.length !== vecB.length) {
    console.warn(`Vector length mismatch: ${vecA.length} vs ${vecB.length}`);
    return null;
  }

  // Calculate dot product (sum of element-wise products)
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  // Calculate magnitude (length) of each vector
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vecA.length; i++) {
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  // Handle zero magnitude (shouldn't happen with real embeddings, but be safe)
  if (magnitudeA === 0 || magnitudeB === 0) {
    return null;
  }

  // Cosine similarity = dot product / (magnitude A * magnitude B)
  const similarity = dotProduct / (magnitudeA * magnitudeB);

  // Clamp to [-1, 1] range (should already be in range, but ensure for floating point precision)
  return Math.max(-1, Math.min(1, similarity));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    
    // User client for auth and ownership verification
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Service role client for bypassing RLS when reading/writing
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { conversationId } = await req.json();
    
    // Verify conversation ownership and get embedding
    const { data: conversation, error: conversationError } = await supabaseUser
      .from('conversations')
      .select('owned_by_profile, entity_embedding')
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      console.error('Error fetching conversation:', conversationError);
      return new Response(
        JSON.stringify({ error: `Database error: ${conversationError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conversation) {
      console.error('Conversation not found:', conversationId);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (conversation.owned_by_profile !== user.id) {
      console.error('Ownership mismatch:', { 
        conversationOwner: conversation.owned_by_profile, 
        userId: user.id 
      });
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not own this conversation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or generate conversation embedding for semantic pre-filtering
    let conversationEmbedding: number[] | null = null;
    try {
      if (conversation.entity_embedding) {
        // Use cached embedding
        conversationEmbedding = JSON.parse(conversation.entity_embedding);
        console.log('✅ Using cached conversation embedding');
      } else {
        // Generate embedding by calling embed-conversation-entities function
        console.log('📝 No cached embedding found, generating...');
        const embedUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/embed-conversation-entities`;
        const embedResponse = await fetch(embedUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          },
          body: JSON.stringify({ conversationId }),
        });

        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          conversationEmbedding = embedData.embedding;
          console.log('✅ Generated conversation embedding');
        } else {
          console.warn('⚠️ Failed to generate embedding, will use GPT-only matching');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error getting conversation embedding:', error);
      // Continue without embedding (fallback to GPT-only)
    }
    
    // Use service role to read entities and contacts (bypasses RLS)
    const { data: entities } = await supabaseService
      .from('conversation_entities')
      .select('*')
      .eq('conversation_id', conversationId);
    
    const { data: contacts } = await supabaseService
      .from('contacts')
      .select(`
        *,
        theses (*)
      `)
      .eq('owned_by_profile', user.id);
    
    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================================
    // SEMANTIC PRE-FILTERING: Use embeddings to find top 50 similar contacts
    // ============================================================================
    let preFilteredContacts = contacts;
    let contactsWithSimilarity: Array<{ contact: any; similarity: number }> = []; // Store similarity scores for later use

    if (conversationEmbedding) {
      console.log('🔍 Starting semantic pre-filtering with embeddings...');
      
      // Calculate similarity for each contact
      for (const contact of contacts) {
        let contactEmbedding: number[] | null = null;
        
        // Prefer thesis_embedding, fall back to bio_embedding
        if (contact.thesis_embedding) {
          try {
            contactEmbedding = JSON.parse(contact.thesis_embedding);
          } catch (e) {
            console.warn(`Failed to parse thesis_embedding for contact ${contact.id}`);
          }
        }
        
        if (!contactEmbedding && contact.bio_embedding) {
          try {
            contactEmbedding = JSON.parse(contact.bio_embedding);
          } catch (e) {
            console.warn(`Failed to parse bio_embedding for contact ${contact.id}`);
          }
        }

        if (contactEmbedding) {
          const similarity = cosineSimilarity(conversationEmbedding, contactEmbedding);
          if (similarity !== null) {
            contactsWithSimilarity.push({ contact, similarity });
          }
        }
      }

      // Sort by similarity (highest first)
      contactsWithSimilarity.sort((a, b) => b.similarity - a.similarity);

      console.log(`📊 Calculated similarity for ${contactsWithSimilarity.length} contacts with embeddings`);
      if (contactsWithSimilarity.length > 0) {
        console.log(`📈 Top 5 similarities: ${contactsWithSimilarity.slice(0, 5).map(c => `${c.contact.name}: ${c.similarity.toFixed(3)}`).join(', ')}`);
      }

      // Select top 50 by similarity
      const topContacts = contactsWithSimilarity.slice(0, 50).map(c => c.contact);
      
      // Also include contacts without embeddings (they'll be scored by GPT)
      const contactsWithoutEmbeddings = contacts.filter(c => {
        const hasThesisEmbedding = c.thesis_embedding && c.thesis_embedding.trim().length > 0;
        const hasBioEmbedding = c.bio_embedding && c.bio_embedding.trim().length > 0;
        return !hasThesisEmbedding && !hasBioEmbedding;
      });

      // Combine: top 50 with embeddings + all without embeddings (up to reasonable limit)
      preFilteredContacts = [...topContacts, ...contactsWithoutEmbeddings.slice(0, 50)];
      
      console.log(`✅ Pre-filtered to ${preFilteredContacts.length} contacts (${topContacts.length} with embeddings, ${Math.min(contactsWithoutEmbeddings.length, 50)} without)`);
    } else {
      console.log('⚠️ No conversation embedding available, skipping pre-filtering (using all contacts)');
    }

    // Separate person names from other entities
    const personNames = entities?.filter(e => e.entity_type === 'person_name').map(e => e.value.toLowerCase()) || [];
    const otherEntities = entities?.filter(e => e.entity_type !== 'person_name') || [];
    
    const entitySummary = otherEntities.reduce((acc, e) => {
      if (!acc[e.entity_type]) acc[e.entity_type] = [];
      acc[e.entity_type].push(e.value);
      return acc;
    }, {} as Record<string, string[]>);

    console.log('Entity summary:', entitySummary);
    console.log('Person names mentioned:', personNames);
    console.log('Total contacts to search:', contacts.length);

    // Enhanced name matching - handle first/last name variations
    // Note: Name matching works on all contacts (not just pre-filtered) since name mentions are explicit
    const nameMatches = contacts.filter(c => {
      if (!c.name) return false;
      
      const contactNameLower = c.name.toLowerCase();
      
      return personNames.some(mentionedName => {
        // Try exact match first
        if (contactNameLower.includes(mentionedName) || mentionedName.includes(contactNameLower)) {
          return true;
        }
        
        // Split into first/last name and try matching both parts
        const mentionedParts = mentionedName.split(/\s+/).filter(p => p.length > 0);
        const contactParts = contactNameLower.split(/\s+/).filter(p => p.length > 0);
        
        // If we have at least 2 parts (first + last), check if both exist in contact name
        if (mentionedParts.length >= 2) {
          const firstName = mentionedParts[0];
          const lastName = mentionedParts[mentionedParts.length - 1];
          
          // Check if both first and last name appear in the contact name
          const hasFirstName = contactParts.some(part => part.includes(firstName) || firstName.includes(part));
          const hasLastName = contactParts.some(part => part.includes(lastName) || lastName.includes(part));
          
          if (hasFirstName && hasLastName) {
            console.log(`✅ Name match: "${mentionedName}" matched with "${c.name}"`);
            return true;
          }
        }
        
        return false;
      });
    }).map(c => {
      // Find embedding similarity for name matches (if available)
      const similarityData = contactsWithSimilarity.find(cs => cs.contact.id === c.id);
      const embeddingSimilarity = similarityData?.similarity ?? null;
      
      return {
        contact_id: c.id,
        contact_name: c.name,
        score: 3, // Person mentioned by name = 3 stars (highest priority)
        semantic_similarity: embeddingSimilarity,
        reasons: ['Mentioned by name in conversation'],
        justification: `${c.name} was specifically mentioned as a potential match during the conversation.`,
      };
    });

    console.log('Name matches found:', nameMatches.length);
    if (nameMatches.length > 0) {
      console.log('Matched contacts:', nameMatches.map(m => m.contact_name).join(', '));
    }

    // Only call OpenAI if there are other entities to match
    let aiMatches: any[] = [];
    if (Object.keys(entitySummary).length > 0) {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      // Use pre-filtered contacts (top 50 by similarity) instead of first 100
      // This removes the arbitrary limit and uses intelligent semantic pre-filtering
      const contactsToScore = preFilteredContacts.slice(0, 50); // Limit to 50 for GPT (pre-filtered by similarity)
      console.log(`🎯 Processing ${contactsToScore.length} pre-filtered contacts for GPT scoring`);

      // Wrap OpenAI call in 25-second timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI request timed out after 25s')), 25000)
      );

      const openaiPromise = fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: `You are a relationship matching engine for VCs and investors. 
          Score each contact based on how well their thesis matches the conversation entities.
          
          IMPORTANT: These contacts have been pre-filtered by semantic similarity using embeddings,
          so they are already relevant. Focus on scoring the quality of the match.
          
          IMPORTANT: Partial matches are valuable! Contacts don't need to match ALL criteria.
          Even if only one field matches (e.g., just "pre-seed" stage), include it as a match.
          
          Scoring guidelines:
          - 3 stars: Strong match (3+ overlapping criteria OR perfect fit for key criteria)
          - 2 stars: Medium match (2 overlapping criteria OR good fit on important criteria)
          - 1 star: Weak match (1 overlapping criterion OR relevant but not perfect fit)
          
          Match on ANY of these:
          - Investment stage (pre-seed, seed, Series A, etc.)
          - Sector/vertical (B2B SaaS, fintech, healthcare, AI, etc.)
          - Check size ($1M, $5M, etc.)
          - Geography (SF Bay Area, NYC, remote, etc.)
          - Persona type (GP, angel, family office, etc.)
          
          Return JSON array (include ALL matches, even 1-star):
          - contact_id: string
          - score: number (1-3)
          - reasons: string[] (what matched, e.g., ["stage: pre-seed", "sector: B2B SaaS"])
          - justification: string (brief explanation why this is a good intro)
          `
        }, {
          role: 'user',
          content: JSON.stringify({
            entities: entitySummary,
            contacts: contactsToScore.map(c => ({
              id: c.id,
              name: c.name,
              company: c.company,
              theses: c.theses
            }))
          })
        }],
        temperature: 0.5,
      }),
    });

      const openaiResponse = await Promise.race([openaiPromise, timeoutPromise]) as Response;

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', openaiResponse.status, errorText);
        throw new Error(`OpenAI API failed: ${openaiResponse.status} - ${errorText}`);
      }

      const openaiData = await openaiResponse.json();
      console.log('OpenAI response:', JSON.stringify(openaiData));
      
      if (!openaiData.choices || !openaiData.choices[0]) {
        console.error('Invalid OpenAI response:', openaiData);
        aiMatches = [];
      } else {
        let content = openaiData.choices[0].message.content;
        console.log('OpenAI content:', content);
        
        // Remove code blocks if present
        if (content.includes('```json')) {
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (content.includes('```')) {
          content = content.replace(/```\n?/g, '');
        }
        
        try {
          aiMatches = JSON.parse(content.trim());
          console.log('AI matches parsed:', aiMatches.length);
          
          // Add contact names and embedding similarity to AI matches
          aiMatches = aiMatches.map((m: any) => {
            const contact = contacts.find(c => c.id === m.contact_id);
            // Find embedding similarity for this contact
            const similarityData = contactsWithSimilarity.find(c => c.contact.id === m.contact_id);
            const embeddingSimilarity = similarityData?.similarity ?? null;
            
            // Combine GPT score (70%) with embedding similarity (30%)
            // GPT score is 1-3, normalize to 0-1 range, then combine
            const gptScoreNormalized = (m.score - 1) / 2; // Convert 1-3 to 0-1
            const embeddingScore = embeddingSimilarity ?? 0; // Already 0-1
            
            // Weighted combination: 70% GPT + 30% embedding
            const combinedScore = 0.7 * gptScoreNormalized + 0.3 * embeddingScore;
            
            // Convert back to 1-3 star scale
            const finalScore = Math.round(1 + combinedScore * 2); // Convert 0-1 to 1-3
            const clampedScore = Math.max(1, Math.min(3, finalScore)); // Ensure 1-3 range
            
            return {
              ...m,
              contact_name: contact?.name || 'Unknown',
              semantic_similarity: embeddingSimilarity,
              gpt_score: m.score, // Store original GPT score for explainability
              score: clampedScore, // Use combined score
            };
          });
        } catch (parseError) {
          console.error('Failed to parse AI matches:', parseError);
          aiMatches = [];
        }
      }
    }
    
    // Merge name matches and AI matches, removing duplicates
    const allMatches = [...nameMatches];
    const nameMatchIds = new Set(nameMatches.map(m => m.contact_id));
    
    for (const aiMatch of aiMatches) {
      if (!nameMatchIds.has(aiMatch.contact_id)) {
        allMatches.push(aiMatch);
      }
    }
    
    console.log('Total matches:', allMatches.length, '(name:', nameMatches.length, ', AI:', aiMatches.length, ')');
    
    if (allMatches.length === 0) {
      console.log('No matches found');
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use service role client to insert matches (bypasses RLS)
    const { data: insertedMatches, error: insertError } = await supabaseService
      .from('match_suggestions')
      .insert(
        allMatches.map((m: any) => ({
          conversation_id: conversationId,
          contact_id: m.contact_id,
          score: m.score,
          semantic_similarity: m.semantic_similarity ?? null, // Embedding similarity score
          reasons: m.reasons,
          justification: m.justification,
          status: 'pending',
        }))
      )
      .select(`
        id,
        conversation_id,
        contact_id,
        score,
        semantic_similarity,
        reasons,
        justification,
        status,
        created_at,
        contacts:contact_id ( name )
      `);
    
    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }
    
    console.log('Inserted matches:', insertedMatches?.length || 0);
    
    // Flatten nested contact names
    const matchesWithNames = insertedMatches?.map((m: any) => ({
      ...m,
      contact_name: m.contacts?.name ?? null
    })) || [];
    
    return new Response(
      JSON.stringify({ matches: matchesWithNames }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate matches error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
