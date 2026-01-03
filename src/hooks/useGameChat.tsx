import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  id: string;
  game_id: string;
  profile_id: string;
  message: string;
  created_at: string;
  username?: string;
}

export function useGameChat(gameId: string | null) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch existing messages
  useEffect(() => {
    if (!gameId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('game_messages')
        .select(`
          *,
          profile:profiles(username)
        `)
        .eq('game_id', gameId)
        .order('created_at');

      if (!error && data) {
        const msgs = data.map(m => ({
          ...m,
          username: m.profile?.username,
        })) as ChatMessage[];
        setMessages(msgs);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [gameId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`game-chat-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_messages',
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          // Fetch username for new message
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', (payload.new as any).profile_id)
            .single();

          const newMessage: ChatMessage = {
            ...(payload.new as any),
            username: profileData?.username,
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [gameId]);

  // Send a message
  const sendMessage = useCallback(async (message: string) => {
    if (!gameId || !profile?.id || !message.trim()) return false;

    try {
      const { error } = await supabase
        .from('game_messages')
        .insert({
          game_id: gameId,
          profile_id: profile.id,
          message: message.trim(),
        });

      return !error;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [gameId, profile?.id]);

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
