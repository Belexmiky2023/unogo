import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, createDeck, shuffle } from '@/lib/unoCards';
import { Json } from '@/integrations/supabase/types';

interface QueueEntry {
  id: string;
  profile_id: string;
  created_at: string;
  status: string;
}

export function useWorldwideMatchmaking() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [matchedGameId, setMatchedGameId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Join matchmaking queue
  const startSearch = useCallback(async () => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to play worldwide",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchTime(0);

    try {
      // Add to queue
      const { error } = await supabase
        .from('matchmaking_queue')
        .upsert({
          profile_id: profile.id,
          status: 'waiting',
        });

      if (error) throw error;

      // Start timer
      searchIntervalRef.current = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);

      // Subscribe to queue changes
      const channel = supabase
        .channel('matchmaking-queue')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matchmaking_queue',
          },
          async () => {
            await checkForMatch();
          }
        )
        .subscribe();

      channelRef.current = channel;

      // Initial check
      await checkForMatch();
    } catch (error) {
      console.error('Error joining queue:', error);
      toast({
        title: "Error",
        description: "Failed to join matchmaking queue",
        variant: "destructive",
      });
      cancelSearch();
    }
  }, [profile?.id, toast]);

  // Check for available match
  const checkForMatch = useCallback(async () => {
    if (!profile?.id) return;

    try {
      // Get all waiting players
      const { data: queue, error } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at');

      if (error) throw error;

      // Need at least 2 players
      if (!queue || queue.length < 2) return;

      // Find ourselves in queue
      const myIndex = queue.findIndex(q => q.profile_id === profile.id);
      if (myIndex === -1) return;

      // We're the first in queue - create the match
      if (myIndex === 0) {
        const opponent = queue[1];
        await createMatch(profile.id, opponent.profile_id);
      }
    } catch (error) {
      console.error('Error checking for match:', error);
    }
  }, [profile?.id]);

  // Create a match between two players
  const createMatch = async (player1Id: string, player2Id: string) => {
    try {
      // Update queue status for both players
      await supabase
        .from('matchmaking_queue')
        .update({ status: 'matched' })
        .in('profile_id', [player1Id, player2Id]);

      // Create the game
      const deck = shuffle(createDeck());
      const hand1 = deck.splice(0, 7);
      const hand2 = deck.splice(0, 7);
      
      let startingCardIndex = deck.findIndex(c => c.color !== 'black');
      if (startingCardIndex === -1) startingCardIndex = 0;
      const startingCard = deck.splice(startingCardIndex, 1)[0];

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          game_type: 'worldwide',
          status: 'playing',
          draw_pile: deck as unknown as Json,
          discard_pile: [startingCard] as unknown as Json,
          current_color: startingCard.color,
          current_player_index: 0,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Add players
      await supabase.from('game_players').insert([
        {
          game_id: game.id,
          profile_id: player1Id,
          player_index: 0,
          hand: hand1 as unknown as Json,
        },
        {
          game_id: game.id,
          profile_id: player2Id,
          player_index: 1,
          hand: hand2 as unknown as Json,
        },
      ]);

      // Remove from queue
      await supabase
        .from('matchmaking_queue')
        .delete()
        .in('profile_id', [player1Id, player2Id]);

      // Set matched game
      setMatchedGameId(game.id);
      setIsSearching(false);

      toast({
        title: "Match Found! 🎮",
        description: "Starting worldwide game...",
      });
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  // Cancel search
  const cancelSearch = useCallback(async () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }

    if (profile?.id) {
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('profile_id', profile.id);
    }

    setIsSearching(false);
    setSearchTime(0);
  }, [profile?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
      }
    };
  }, []);

  // Subscribe to our queue entry for match notifications
  useEffect(() => {
    if (!profile?.id || !isSearching) return;

    const channel = supabase
      .channel(`queue-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matchmaking_queue',
          filter: `profile_id=eq.${profile.id}`,
        },
        async (payload) => {
          if ((payload.new as any).status === 'matched') {
            // We got matched! Find the game
            const { data: game } = await supabase
              .from('game_players')
              .select('game_id')
              .eq('profile_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (game) {
              setMatchedGameId(game.game_id);
              setIsSearching(false);
              
              toast({
                title: "Match Found! 🎮",
                description: "Starting worldwide game...",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.id, isSearching, toast]);

  return {
    isSearching,
    searchTime,
    matchedGameId,
    startSearch,
    cancelSearch,
  };
}
