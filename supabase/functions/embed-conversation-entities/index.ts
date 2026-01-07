import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  if (!text || text.trim().length === 0) {
    return null;
  }
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000), // Limit to 8000 chars
      }),
    });
    if (!response.ok) {
      console.error('OpenAI embedding error:', response.status);
      return null;
    }
    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
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
    
    // Service role client for bypassing RLS
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { conversationId, forceRegenerate = false } = await req.json();
    
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    
    // Verify conversation ownership
    const { data: conversation } = await supabaseUser
      .from('conversations')
      .select('id, entity_embedding, owned_by_profile')
      .eq('id', conversationId)
      .single();

    if (!conversation || conversation.owned_by_profile !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not own this conversation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if embedding exists and is cached
    if (!forceRegenerate && conversation.entity_embedding) {
      try {
        const cachedEmbedding = JSON.parse(conversation.entity_embedding);
        return new Response(
          JSON.stringify({ 
            embedding: cachedEmbedding,
            cached: true,
            conversationId 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.log('Failed to parse cached embedding, regenerating...');
      }
    }
    
    // Fetch all entities for this conversation
    const { data: entities, error: entitiesError } = await supabaseService
      .from('conversation_entities')
      .select('entity_type, value')
      .eq('conversation_id', conversationId);
    
    if (entitiesError) {
      throw entitiesError;
    }
    
    if (!entities || entities.length === 0) {
      return new Response(
        JSON.stringify({ 
          embedding: null,
          cached: false,
          message: 'No entities found for this conversation',
          conversationId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Combine entity values into text for embedding
    // Format: "entity_type1: value1 entity_type2: value2 ..."
    const entityText = entities
      .map(e => `${e.entity_type}: ${e.value}`)
      .join(' ');
    
    console.log(`Generating embedding for ${entities.length} entities (${entityText.length} chars)`);
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    
    const embedding = await generateEmbedding(entityText, openaiApiKey);
    
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }
    
    // Cache embedding in conversations table
    const { error: updateError } = await supabaseService
      .from('conversations')
      .update({ entity_embedding: JSON.stringify(embedding) })
      .eq('id', conversationId);
    
    if (updateError) {
      console.error('Failed to cache embedding:', updateError);
      // Still return the embedding even if caching fails
    }
    
    console.log(`Successfully generated and cached embedding for conversation: ${conversationId}`);
    
    return new Response(
      JSON.stringify({ 
        embedding,
        cached: false,
        conversationId,
        entityCount: entities.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Embed conversation entities error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

