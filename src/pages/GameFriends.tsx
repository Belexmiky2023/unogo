import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Trophy, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { GameLobby } from "@/components/game/GameLobby";
import { MultiplayerBoard } from "@/components/game/MultiplayerBoard";
import { InviteNotification } from "@/components/game/InviteNotification";
import unogoLogo from "@/assets/unogo-logo.png";

const GameFriends = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const {
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
  } = useMultiplayer();
  
  const [view, setView] = useState<'menu' | 'lobby' | 'playing'>('menu');

  // Check for join link
  useEffect(() => {
    const joinId = searchParams.get('join');
    if (joinId && profile && !currentGame) {
      joinGame(joinId);
    }
  }, [searchParams, profile, currentGame, joinGame]);

  // Update view based on game state
  useEffect(() => {
    if (currentGame) {
      if (currentGame.status === 'waiting') {
        setView('lobby');
      } else if (currentGame.status === 'playing') {
        setView('playing');
      } else if (currentGame.status === 'finished') {
        // Stay on playing view but show winner
      }
    }
  }, [currentGame?.status]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleCreateGame = async () => {
    const gameId = await createGame();
    if (gameId) {
      setView('lobby');
    }
  };

  const handleLeaveGame = () => {
    leaveGame();
    setView('menu');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-uno-yellow" />
      </div>
    );
  }

  // Winner screen
  if (currentGame?.status === 'finished') {
    const winner = currentGame.players.find(p => p.profile_id === currentGame.winner_id);
    const isWinner = winner?.profile_id === profile?.id;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-uno-yellow/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-uno-green/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="relative z-10"
        >
          <GlassCard className="text-center max-w-md" hover={false}>
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Trophy className={`w-20 h-20 mx-auto mb-4 ${isWinner ? 'text-uno-yellow' : 'text-muted-foreground'}`} />
            </motion.div>

            <h1 className="text-3xl font-bold font-nunito mb-2">
              {isWinner ? "You Win! 🎉" : "Game Over!"}
            </h1>
            
            <p className="text-muted-foreground font-nunito mb-6">
              {isWinner 
                ? "Congratulations! You've won the game!"
                : `@${winner?.username} won the game!`
              }
            </p>

            <div className="flex gap-4 justify-center">
              <GameButton
                variant="blue"
                onClick={handleLeaveGame}
                icon={<Home className="w-4 h-4" />}
              >
                Back to Menu
              </GameButton>
              <GameButton
                variant="rainbow"
                onClick={handleCreateGame}
              >
                Play Again
              </GameButton>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Invite notifications - always visible */}
      <InviteNotification
        invites={pendingInvites}
        onAccept={acceptInvite}
        onDecline={declineInvite}
      />

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-uno-yellow/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-uno-green/15 rounded-full blur-3xl" />
      </div>

      {view === 'playing' && currentGame ? (
        <MultiplayerBoard
          game={currentGame}
          onPlayCard={playCard}
          onDrawCard={drawCard}
        />
      ) : (
        <div className="relative z-10 py-8 px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <button
              onClick={() => view === 'lobby' ? handleLeaveGame() : navigate("/play")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 font-nunito font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              {view === 'lobby' ? 'Leave Game' : 'Back'}
            </button>

            <div className="flex justify-center mb-6">
              <img src={unogoLogo} alt="UNOGO" className="w-40" />
            </div>

            <h1 className="text-3xl font-bold text-center mb-2 font-nunito">
              Play With Friends
            </h1>
          </motion.div>

          {/* Content based on view */}
          <AnimatePresence mode="wait">
            {view === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-md mx-auto mt-8"
              >
                <GlassCard hover={false} className="text-center">
                  <h2 className="text-xl font-bold font-nunito mb-4">
                    Start a Game
                  </h2>
                  <p className="text-muted-foreground font-nunito mb-6">
                    Create a game lobby and invite your friends to play!
                  </p>
                  
                  <GameButton
                    variant="rainbow"
                    size="lg"
                    className="w-full"
                    onClick={handleCreateGame}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Create Game Lobby"
                    )}
                  </GameButton>

                  {pendingInvites.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <p className="text-muted-foreground font-nunito text-sm mb-2">
                        You have {pendingInvites.length} pending invite{pendingInvites.length > 1 ? 's' : ''}!
                      </p>
                      <p className="text-xs text-muted-foreground font-nunito">
                        Check the notification in the top right corner
                      </p>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {view === 'lobby' && currentGame && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8"
              >
                <GameLobby
                  game={currentGame}
                  onStartGame={() => startGame(currentGame.id)}
                  onSendInvite={(profileId) => sendInvite(profileId, currentGame.id)}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default GameFriends;