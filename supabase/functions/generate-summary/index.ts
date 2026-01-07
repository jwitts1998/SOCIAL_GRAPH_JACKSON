import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // Service role client for bypassing RLS when updating
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { conversationId } = await req.json();
    
    // Verify conversation ownership using user client
    const { data: conversation } = await supabaseUser
      .from('conversations')
      .select('owned_by_profile')
      .eq('id', conversationId)
      .single();

    if (!conversation || conversation.owned_by_profile !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not own this conversation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use service role to read segments (bypasses RLS)
    const { data: segments } = await supabaseService
      .from('conversation_segments')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp_ms');
    
    if (!segments || segments.length === 0) {
      throw new Error('No conversation segments found');
    }

    // Build full transcript
    const transcript = segments.map(s => s.text).join('\n');
    console.log(`Processing ${segments.length} segments (${transcript.length} chars) for summary`);
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Wrap OpenAI call in 30-second timeout to prevent edge function timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI request timed out after 30s')), 30000)
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
          content: `You are a helpful assistant that creates concise, informative summaries of conversations. 
          Create a clear, well-structured summary that captures the key points, topics discussed, and any important decisions or action items.
          Keep it professional and focused on the main content of the conversation.`
        }, {
          role: 'user',
          content: `Please provide a summary of the following conversation:\n\n${transcript}`
        }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const openaiResponse = await Promise.race([openaiPromise, timeoutPromise]) as Response;

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API failed: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI summary response received');

    if (!openaiData.choices || !openaiData.choices[0]) {
      throw new Error('Invalid OpenAI response: ' + JSON.stringify(openaiData));
    }

    const summary = openaiData.choices[0].message.content.trim();
    console.log('Generated summary length:', summary.length);

    // Update conversation with summary using service role
    const { error: updateError } = await supabaseService
      .from('conversations')
      .update({ summary })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation summary:', updateError);
      throw new Error('Failed to save summary: ' + updateError.message);
    }

    console.log('Summary saved successfully');

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

