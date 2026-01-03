import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardColor, createDeck, shuffle, dealCards } from "@/lib/unoCards";
import { Json } from "@/integrations/supabase/types";

export interface GamePlayer {
  id: string;
  profile_id: string | null;
  ai_name: string | null;
  player_index: number;
  hand: Card[];
  is_ai: boolean;
  is_active: boolean;
  has_called_uno: boolean;
  username?: string;
}

export interface MultiplayerGame {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  current_player_index: number;
  direction: number;
  draw_pile: Card[];
  discard_pile: Card[];
  current_color: CardColor | null;
  winner_id: string | null;
  players: GamePlayer[];
}

export interface GameInvite {
  id: string;
  game_id: string;
  from_profile_id: string;
  to_profile_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  from_username?: string;
}

export function useMultiplayer() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [currentGame, setCurrentGame] = useState<MultiplayerGame | null>(null);
  const [pendingInvites, setPendingInvites] = useState<GameInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const gameChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const inviteChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Subscribe to game invites
  useEffect(() => {
    if (!profile?.id) return;

    const fetchInvites = async () => {
      const { data, error } = await supabase
        .from('game_invites')
        .select(`
          *,
          from_profile:profiles!game_invites_from_profile_id_fkey(username)
        `)
        .eq('to_profile_id', profile.id)
        .eq('status', 'pending');

      if (!error && data) {
        const invites = data.map(invite => ({
          ...invite,
          from_username: invite.from_profile?.username,
        })) as GameInvite[];
        setPendingInvites(invites);
      }
    };

    fetchInvites();

    // Subscribe to new invites
    const channel = supabase
      .channel('game-invites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_invites',
          filter: `to_profile_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log('Invite change:', payload);
          if (payload.eventType === 'INSERT') {
            // Fetch the full invite with from_username
            const { data } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', (payload.new as any).from_profile_id)
              .single();
            
            const newInvite = {
              ...payload.new,
              from_username: data?.username,
            } as GameInvite;
            
            setPendingInvites(prev => [...prev, newInvite]);
            
            toast({
              title: "Game Invite! 🎮",
              description: `@${data?.username} wants to play UNO with you!`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setPendingInvites(prev => 
              prev.filter(i => i.id !== (payload.new as any).id || (payload.new as any).status === 'pending')
            );
          } else if (payload.eventType === 'DELETE') {
            setPendingInvites(prev => prev.filter(i => i.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    inviteChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.id, toast]);

  // Subscribe to game updates
  const subscribeToGame = useCallback((gameId: string) => {
    if (gameChannelRef.current) {
      gameChannelRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        async (payload) => {
          console.log('Game update:', payload);
          if (payload.eventType === 'UPDATE') {
            await refreshGame(gameId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`,
        },
        async () => {
          console.log('Player update');
          await refreshGame(gameId);
        }
      )
      .subscribe();

    gameChannelRef.current = channel;
  }, []);

  const refreshGame = async (gameId: string) => {
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) {
      console.error('Error fetching game:', gameError);
      return;
    }

    const { data: playersData, error: playersError } = await supabase
      .from('game_players')
      .select(`
        *,
        profile:profiles(username)
      `)
      .eq('game_id', gameId)
      .order('player_index');

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return;
    }

    const players: GamePlayer[] = playersData.map(p => ({
      id: p.id,
      profile_id: p.profile_id,
      ai_name: p.ai_name,
      player_index: p.player_index,
      hand: (p.hand as unknown as Card[]) || [],
      is_ai: p.is_ai,
      is_active: p.is_active,
      has_called_uno: p.has_called_uno,
      username: p.profile?.username,
    }));

    setCurrentGame({
      id: gameData.id,
      status: gameData.status as 'waiting' | 'playing' | 'finished',
      current_player_index: gameData.current_player_index,
      direction: gameData.direction,
      draw_pile: (gameData.draw_pile as unknown as Card[]) || [],
      discard_pile: (gameData.discard_pile as unknown as Card[]) || [],
      current_color: gameData.current_color as CardColor | null,
      winner_id: gameData.winner_id,
      players,
    });
  };

  // Create a new game lobby
  const createGame = async () => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a game",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      // Create the game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          game_type: 'friends',
          status: 'waiting',
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Add the creator as player 0
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          profile_id: profile.id,
          player_index: 0,
          hand: [],
          is_ai: false,
        });

      if (playerError) throw playerError;

      subscribeToGame(game.id);
      await refreshGame(game.id);

      toast({
        title: "Game Created!",
        description: "Invite friends to join your game",
      });

      return game.id;
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Send invite to a player
  const sendInvite = async (toProfileId: string, gameId: string) => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase
        .from('game_invites')
        .insert({
          game_id: gameId,
          from_profile_id: profile.id,
          to_profile_id: toProfileId,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Invite Sent!",
        description: "Waiting for them to accept...",
      });

      return true;
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invite",
        variant: "destructive",
      });
      return false;
    }
  };

  // Accept an invite
  const acceptInvite = async (invite: GameInvite) => {
    if (!profile?.id) return false;

    setIsLoading(true);

    try {
      // Update invite status
      const { error: inviteError } = await supabase
        .from('game_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      if (inviteError) throw inviteError;

      // Get current player count
      const { data: players, error: countError } = await supabase
        .from('game_players')
        .select('player_index')
        .eq('game_id', invite.game_id)
        .order('player_index', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextIndex = (players?.[0]?.player_index ?? -1) + 1;

      // Join the game
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: invite.game_id,
          profile_id: profile.id,
          player_index: nextIndex,
          hand: [],
          is_ai: false,
        });

      if (joinError) throw joinError;

      // Remove from pending invites
      setPendingInvites(prev => prev.filter(i => i.id !== invite.id));

      subscribeToGame(invite.game_id);
      await refreshGame(invite.game_id);

      toast({
        title: "Joined Game!",
        description: "Waiting for the host to start...",
      });

      return true;
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: "Error",
        description: "Failed to join game",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Decline an invite
  const declineInvite = async (invite: GameInvite) => {
    try {
      const { error } = await supabase
        .from('game_invites')
        .update({ status: 'declined' })
        .eq('id', invite.id);

      if (error) throw error;

      setPendingInvites(prev => prev.filter(i => i.id !== invite.id));

      return true;
    } catch (error) {
      console.error('Error declining invite:', error);
      return false;
    }
  };

  // Start the game (host only)
  const startGame = async (gameId: string) => {
    if (!currentGame) return false;

    setIsLoading(true);

    try {
      const playerCount = currentGame.players.length;
      if (playerCount < 2) {
        toast({
          title: "Need More Players",
          description: "You need at least 2 players to start",
          variant: "destructive",
        });
        return false;
      }

      // Create and shuffle deck
      const deck = shuffle(createDeck());
      
      // Deal 7 cards to each player
      const hands: Card[][] = [];
      for (let i = 0; i < playerCount; i++) {
        hands.push(deck.splice(0, 7));
      }

      // Find a non-wild starting card
      let startingCardIndex = deck.findIndex(c => c.color !== 'black');
      if (startingCardIndex === -1) startingCardIndex = 0;
      const startingCard = deck.splice(startingCardIndex, 1)[0];

      // Update player hands
      for (let i = 0; i < currentGame.players.length; i++) {
        const { error } = await supabase
          .from('game_players')
          .update({ hand: hands[i] as unknown as Json })
          .eq('id', currentGame.players[i].id);

        if (error) throw error;
      }

      // Update game state
      const { error: gameError } = await supabase
        .from('games')
        .update({
          status: 'playing',
          draw_pile: deck as unknown as Json,
          discard_pile: [startingCard] as unknown as Json,
          current_color: startingCard.color as string,
          current_player_index: 0,
        })
        .eq('id', gameId);

      if (gameError) throw gameError;

      toast({
        title: "Game Started! 🎮",
        description: "Let's play UNO!",
      });

      return true;
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Play a card
  const playCard = async (card: Card, chosenColor?: CardColor) => {
    if (!currentGame || !profile?.id) return false;

    const myPlayer = currentGame.players.find(p => p.profile_id === profile.id);
    if (!myPlayer) return false;

    if (currentGame.current_player_index !== myPlayer.player_index) {
      toast({
        title: "Not Your Turn",
        description: "Wait for your turn!",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Remove card from hand
      const newHand = myPlayer.hand.filter(c => c.id !== card.id);
      
      // Add to discard pile
      const newDiscardPile = [...currentGame.discard_pile, card];
      
      // Determine new color
      const newColor = card.color === 'black' ? (chosenColor || 'red') : card.color as CardColor;
      
      // Calculate next player and direction
      let newDirection = currentGame.direction;
      let skipNext = false;
      let drawAmount = 0;
      
      switch (card.value) {
        case 'reverse':
          newDirection = currentGame.direction * -1;
          if (currentGame.players.length === 2) skipNext = true;
          break;
        case 'skip':
          skipNext = true;
          break;
        case 'draw2':
          drawAmount = 2;
          skipNext = true;
          break;
        case 'wild_draw4':
          drawAmount = 4;
          skipNext = true;
          break;
      }

      let nextPlayerIndex = (currentGame.current_player_index + newDirection + currentGame.players.length) % currentGame.players.length;
      
      // Handle draw cards for next player
      let newDrawPile = [...currentGame.draw_pile];
      if (drawAmount > 0) {
        const targetPlayer = currentGame.players[nextPlayerIndex];
        const drawnCards = newDrawPile.splice(0, drawAmount);
        const targetNewHand = [...targetPlayer.hand, ...drawnCards];
        
        await supabase
          .from('game_players')
          .update({ hand: targetNewHand as unknown as Json })
          .eq('id', targetPlayer.id);
      }

      // Skip next player if needed
      if (skipNext) {
        nextPlayerIndex = (nextPlayerIndex + newDirection + currentGame.players.length) % currentGame.players.length;
      }

      // Check for winner
      const isWinner = newHand.length === 0;

      // Update my hand
      await supabase
        .from('game_players')
        .update({ hand: newHand as unknown as Json })
        .eq('id', myPlayer.id);

      // Update game state
      await supabase
        .from('games')
        .update({
          discard_pile: newDiscardPile as unknown as Json,
          draw_pile: newDrawPile as unknown as Json,
          current_color: newColor,
          direction: newDirection,
          current_player_index: nextPlayerIndex,
          status: isWinner ? 'finished' : 'playing',
          winner_id: isWinner ? profile.id : null,
        })
        .eq('id', currentGame.id);

      return true;
    } catch (error) {
      console.error('Error playing card:', error);
      return false;
    }
  };

  // Draw a card
  const drawCard = async () => {
    if (!currentGame || !profile?.id) return false;

    const myPlayer = currentGame.players.find(p => p.profile_id === profile.id);
    if (!myPlayer) return false;

    if (currentGame.current_player_index !== myPlayer.player_index) {
      toast({
        title: "Not Your Turn",
        description: "Wait for your turn!",
        variant: "destructive",
      });
      return false;
    }

    try {
      let newDrawPile = [...currentGame.draw_pile];
      let newDiscardPile = [...currentGame.discard_pile];

      // Reshuffle if needed
      if (newDrawPile.length === 0) {
        const topCard = newDiscardPile.pop()!;
        newDrawPile = shuffle(newDiscardPile);
        newDiscardPile = [topCard];
      }

      const drawnCard = newDrawPile.pop()!;
      const newHand = [...myPlayer.hand, drawnCard];

      // Calculate next player
      const nextPlayerIndex = (currentGame.current_player_index + currentGame.direction + currentGame.players.length) % currentGame.players.length;

      // Update my hand
      await supabase
        .from('game_players')
        .update({ hand: newHand as unknown as Json })
        .eq('id', myPlayer.id);

      // Update game state
      await supabase
        .from('games')
        .update({
          draw_pile: newDrawPile as unknown as Json,
          discard_pile: newDiscardPile as unknown as Json,
          current_player_index: nextPlayerIndex,
        })
        .eq('id', currentGame.id);

      return true;
    } catch (error) {
      console.error('Error drawing card:', error);
      return false;
    }
  };

  // Leave game
  const leaveGame = async () => {
    if (gameChannelRef.current) {
      gameChannelRef.current.unsubscribe();
      gameChannelRef.current = null;
    }
    setCurrentGame(null);
  };

  // Join existing game by ID
  const joinGame = async (gameId: string) => {
    subscribeToGame(gameId);
    await refreshGame(gameId);
  };

  return {
    currentGame,
    pendingInvites,
    isLoading,
    createGame,
    sendInvite,
    acceptInvite,
    declineInvite,
    startGame,
    playCard,
    drawCard,
    leaveGame,
    joinGame,
  };
}