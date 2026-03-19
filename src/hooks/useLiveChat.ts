import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
}

export function useLiveChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Load existing messages
    supabase.from('live_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) {
          setMessages(data as ChatMessage[]);
          const pinned = data.find((m: any) => m.is_pinned);
          if (pinned) setPinnedMessage(pinned as ChatMessage);
        }
      });

    // Subscribe to real-time
    const channel = supabase.channel(`chat-${sessionId}`);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'chat-message' }, ({ payload }) => {
      setMessages(prev => [...prev.slice(-200), payload.message]);
    });

    channel.on('broadcast', { event: 'chat-delete' }, ({ payload }) => {
      setMessages(prev => prev.filter(m => m.id !== payload.messageId));
    });

    channel.on('broadcast', { event: 'chat-pin' }, ({ payload }) => {
      setPinnedMessage(payload.message);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sendMessage = useCallback(async (text: string, userName: string, userId: string, userAvatar?: string) => {
    if (!sessionId || !text.trim()) return;

    const msg = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      message: text.trim(),
      is_pinned: false,
      created_at: new Date().toISOString(),
    };

    await supabase.from('live_chat_messages').insert(msg);
    channelRef.current?.send({ type: 'broadcast', event: 'chat-message', payload: { message: msg } });
  }, [sessionId]);

  const deleteMessage = useCallback(async (messageId: string) => {
    await supabase.from('live_chat_messages').delete().eq('id', messageId);
    channelRef.current?.send({ type: 'broadcast', event: 'chat-delete', payload: { messageId } });
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  const pinMessage = useCallback(async (message: ChatMessage) => {
    await supabase.from('live_chat_messages').update({ is_pinned: false }).eq('session_id', message.id);
    await supabase.from('live_chat_messages').update({ is_pinned: true }).eq('id', message.id);
    setPinnedMessage(message);
    channelRef.current?.send({ type: 'broadcast', event: 'chat-pin', payload: { message } });
  }, []);

  return { messages, pinnedMessage, sendMessage, deleteMessage, pinMessage };
}
