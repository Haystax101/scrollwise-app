// supabase/functions/create-chat-on-insight-reply/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    const { responderId, authorId, insightResponseId, insightResponseContent } = await req.json();
    console.log('Function received request with:', { responderId, authorId, insightResponseId, insightResponseContent });

    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User is not authenticated.');
      return new Response(JSON.stringify({ error: 'User is not authenticated.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('Authenticated user:', user.id);

    // Check for existing connection
    console.log('Checking for existing connection...');
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .or(`and(user_id_1.eq.${responderId},user_id_2.eq.${authorId}),and(user_id_1.eq.${authorId},user_id_2.eq.${responderId})`);

    if (connectionError) {
      console.error('Error checking for connection:', connectionError);
      throw connectionError;
    }
    console.log('Existing connection check complete. Found:', connection);

    if (!connection || connection.length === 0) {
      // Create new connection
      console.log('No existing connection found. Creating new connection...');
      const { error: insertConnectionError } = await supabase.from('connections').insert([{ user_id_1: responderId, user_id_2: authorId }]);
      if (insertConnectionError) {
        console.error('Error creating new connection:', insertConnectionError);
        throw insertConnectionError;
      }
      console.log('New connection created.');
    }

    // Check for existing chat
    console.log('Checking for existing chat...');
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .contains('participant_ids', [responderId, authorId]);

    if (chatError) {
      console.error('Error checking for chat:', chatError);
      throw chatError;
    }
    console.log('Existing chat check complete. Found:', chat);

    let chatId = chat && chat.length > 0 ? chat[0].id : null;

    if (!chatId) {
      // Create new chat
      console.log('No existing chat found. Creating new chat...');
      const { data: newChat, error: newChatError } = await supabase
        .from('chats')
        .insert([{ participant_ids: [responderId, authorId] }])
        .select('id')
        .single();

      if (newChatError) {
        console.error('Error creating new chat:', newChatError);
        throw newChatError;
      }
      chatId = newChat.id;
      console.log(`New chat created with id: ${chatId}.`);

      // Add the insight response as the first message
      console.log('Adding insight response as the first message...');
      const { error: messageError } = await supabase.from('chat_messages').insert([
        { chat_id: chatId, sender_id: responderId, content: insightResponseContent },
      ]);

      if (messageError) {
        console.error('Error creating first message:', messageError);
        throw messageError;
      }
      console.log('First message added.');
    }

    // Delete the original insight response
    console.log(`Deleting insight response with id: ${insightResponseId}`);
    const { error: deleteError } = await supabase.from('insight_responses').delete().eq('id', insightResponseId);
    if (deleteError) {
      console.error('Error deleting insight response:', deleteError);
      throw deleteError;
    }
    console.log('Insight response deleted.');

    return new Response(JSON.stringify({ chatId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}); 