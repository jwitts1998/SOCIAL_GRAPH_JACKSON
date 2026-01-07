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
    
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    
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
      return new Response(
        JSON.stringify({ tasks: [], message: 'No conversation segments found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use all segments for task extraction (tasks can come from anywhere in conversation)
    const transcript = segments.map(s => s.text).join('\n');
    console.log(`Processing ${segments.length} segments (${transcript.length} chars) for task extraction`);
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Get existing contacts to check for create_contact tasks
    const { data: existingContacts } = await supabaseService
      .from('contacts')
      .select('id, name')
      .eq('owned_by_profile', user.id);
    
    const existingContactNames = new Set(
      (existingContacts || []).map(c => c.name?.toLowerCase().trim()).filter(Boolean)
    );

    // Wrap OpenAI call in 30-second timeout
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
          content: `You are a task extraction system for VC/investor conversations. Extract actionable tasks and commitments from the conversation transcript.

Return a JSON array of tasks. Each task should have:
- task_type: one of ["user_action", "other_commitment", "create_contact", "schedule_meeting", "share_document", "request_intro", "research", "investment_action", "relationship"]
- title: Short, actionable task title (e.g., "Send follow-up email", "Schedule meeting with John")
- description: Detailed description of what needs to be done
- assigned_to: "user" if the primary user should do it, "other_participant" if the other person committed to doing it
- other_participant_name: Name of the other participant (only if assigned_to is "other_participant")
- priority: "low", "medium", or "high" based on urgency/importance
- due_date: ISO 8601 date string if a specific date/time was mentioned, null otherwise

Task Type Guidelines:
- user_action: Things the primary user needs to do (e.g., "I'll send you the deck", "I should follow up")
- other_commitment: Things the other person said they'll do (e.g., "They said they'll review our proposal")
- create_contact: Only if a person is mentioned by name and should be added to contacts (check if name exists in existing contacts list)
- schedule_meeting: Scheduling-related tasks (e.g., "Schedule follow-up call", "Set up coffee meeting")
- share_document: Document sharing tasks (e.g., "Send pitch deck", "Share term sheet")
- request_intro: Introduction requests (e.g., "Request intro to X", "Get connected to Y")
- research: Research tasks (e.g., "Research company X", "Look into Y market")
- investment_action: Investment-specific tasks (e.g., "Review term sheet", "Prepare investment memo")
- relationship: Relationship building (e.g., "Send thank you note", "Connect on LinkedIn")

For create_contact tasks:
- Only create if person is mentioned by name
- Title should be: "Create contact for [Name]"
- Description should include context about the person
- Check the existing contacts list to avoid duplicates

Examples:
- "I'll send you the deck tomorrow" → user_action, assigned_to: "user", priority: "medium", due_date: tomorrow's date
- "They said they'll review our proposal next week" → other_commitment, assigned_to: "other_participant", priority: "medium"
- "I should connect with John Doe" → create_contact (if John Doe not in existing contacts), assigned_to: "user"
- "Let's schedule a follow-up call" → schedule_meeting, assigned_to: "user", priority: "high"

Return ONLY a valid JSON array, no other text.`
        }, {
          role: 'user',
          content: `Conversation transcript:\n\n${transcript}\n\nExisting contacts: ${Array.from(existingContactNames).join(', ') || 'None'}`
        }],
        temperature: 0.3,
      }),
    });

    const openaiResponse = await Promise.race([openaiPromise, timeoutPromise]) as Response;

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API failed: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || !openaiData.choices[0]) {
      throw new Error('Invalid OpenAI response: ' + JSON.stringify(openaiData));
    }
    
    let content = openaiData.choices[0].message.content;
    console.log('OpenAI task extraction response:', content);
    
    // Remove code blocks if present
    if (content.includes('```json')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.includes('```')) {
      content = content.replace(/```\n?/g, '');
    }
    
    const tasks = JSON.parse(content.trim());
    console.log('Parsed tasks:', JSON.stringify(tasks, null, 2));
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      console.log('No tasks found');
      return new Response(
        JSON.stringify({ tasks: [], extracted_count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Insert tasks into database
    const tasksToInsert = tasks.map((task: any) => ({
      conversation_id: conversationId,
      task_type: task.task_type,
      title: task.title,
      description: task.description || null,
      assigned_to: task.assigned_to || 'user',
      other_participant_name: task.other_participant_name || null,
      status: 'pending',
      priority: task.priority || 'medium',
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      linked_contact_id: null, // Will be set later if create_contact task
      created_by: 'system',
    }));
    
    const { data: insertedTasks, error: insertError } = await supabaseService
      .from('conversation_tasks')
      .insert(tasksToInsert)
      .select();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }
    
    console.log('Inserted tasks:', insertedTasks?.length || 0);
    
    return new Response(
      JSON.stringify({ 
        tasks: insertedTasks,
        extracted_count: insertedTasks?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Extract tasks error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

