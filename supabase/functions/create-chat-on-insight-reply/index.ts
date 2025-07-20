// supabase/functions/create-chat-on-insight-reply/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    const {
      responderId,
      authorId,
      insightResponseId,
      insightResponseContent,
    } = await req.json();
    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Check for existing connection
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .or(
        `and(user_id_1.eq.${responderId},user_id_2.eq.${authorId}),and(user_id_1.eq.${authorId},user_id_2.eq.${responderId})`
      );

    if (connectionError) throw connectionError;

    if (!connection || connection.length === 0) {
      // Create new connection
      await supabase.from('connections').insert([{ user_id_1: responderId, user_id_2: authorId }]);
    }

    // Check for existing chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .contains('participant_ids', [responderId, authorId]);

    if (chatError) throw chatError;

    if (chat && chat.length > 0) {
      // Insert the initial insight message and the response as labeled messages if not already present
      if (insightResponseContent && insightResponseId) {
        // Fetch the original insight content
        const { data: insightData, error: insightError } = await supabase
          .from('insight_responses')
          .select('insight_id, content, original_author_id')
          .eq('id', insightResponseId)
          .single();
        if (insightError) throw insightError;

        // Insert the original insight as a labeled message if not already present
        if (insightData && insightData.insight_content) {
          const labeledInsight = `[INSIGHT] ${insightData.insight_content}`;
          const { data: existingInsightMsg, error: existingInsightError } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('chat_id', chat[0].id)
            .eq('content', labeledInsight)
            .eq('sender_id', insightData.author_id);
          if (existingInsightError) throw existingInsightError;
          if (!existingInsightMsg || existingInsightMsg.length === 0) {
            await supabase.from('chat_messages').insert([
              {
                chat_id: chat[0].id,
                sender_id: insightData.author_id,
                content: labeledInsight,
              },
            ]);
          }
        }

        // Insert the insight response as a labeled message if not already present
        const labeledResponse = `[INSIGHT] ${insightResponseContent}`;
        const { data: existingMsg, error: msgError } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('chat_id', chat[0].id)
          .eq('content', labeledResponse)
          .eq('sender_id', responderId);
        if (msgError) throw msgError;
        if (!existingMsg || existingMsg.length === 0) {
          await supabase.from('chat_messages').insert([
            {
              chat_id: chat[0].id,
              sender_id: responderId,
              content: labeledResponse,
            },
          ]);
        }
        // Optionally delete the insight response
        await supabase.from('insight_responses').delete().eq('id', insightResponseId);
      }
      return new Response(JSON.stringify({ chatId: chat[0].id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create new chat
    const { data: newChat, error: newChatError } = await supabase
      .from('chats')
      .insert([{ participant_ids: [responderId, authorId] }])
      .select('id')
      .single();

    if (newChatError) throw newChatError;

    // Insert the initial insight message and the response as labeled messages
    if (insightResponseContent && insightResponseId) {
      // Fetch the original insight content
      const { data: insightData, error: insightError } = await supabase
        .from('insight_responses')
        .select('insight_id, content, original_author_id')
        .eq('id', insightResponseId)
        .single();
      if (insightError) throw insightError;

      if (insightData && insightData.insight_content) {
        const labeledInsight = `[INSIGHT] ${insightData.insight_content}`;
        await supabase.from('chat_messages').insert([
          {
            chat_id: newChat.id,
            sender_id: insightData.author_id,
            content: labeledInsight,
          },
        ]);
      }

      const labeledResponse = `[INSIGHT] ${insightResponseContent}`;
      await supabase.from('chat_messages').insert([
        {
          chat_id: newChat.id,
          sender_id: responderId,
          content: labeledResponse,
        },
      ]);
      // Optionally delete the insight response
      await supabase.from('insight_responses').delete().eq('id', insightResponseId);
    }

    return new Response(JSON.stringify({ chatId: newChat.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({ error: typeof error === 'object' ? JSON.stringify(error) : String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});