import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, X, Loader2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorldwideMatchmaking } from "@/hooks/useWorldwideMatchmaking";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { MultiplayerBoard } from "@/components/game/MultiplayerBoard";
import { GameChat } from "@/components/game/GameChat";
import unogoLogo from "@/assets/unogo-logo.png";

const GameWorldwide = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { isSearching, searchTime, matchedGameId, startSearch, cancelSearch } = useWorldwideMatchmaking();
  const { currentGame, playCard, drawCard, joinGame } = useMultiplayer();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Join matched game
  useEffect(() => {
    if (matchedGameId) {
      joinGame(matchedGameId);
    }
  }, [matchedGameId, joinGame]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-uno-yellow" />
      </div>
    );
  }

  // Show game board if in a game
  if (currentGame && currentGame.status === 'playing') {
    return (
      <>
        <MultiplayerBoard
          game={currentGame}
          onPlayCard={playCard}
          onDrawCard={drawCard}
        />
        <GameChat gameId={currentGame.id} />
      </>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-uno-blue/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-uno-green/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => isSearching ? cancelSearch() : navigate("/play")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 font-nunito font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            {isSearching ? "Cancel" : "Back"}
          </button>

          <div className="flex justify-center mb-6">
            <img src={unogoLogo} alt="UNOGO" className="w-40" />
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 font-nunito">
            Play Worldwide
          </h1>
          <p className="text-muted-foreground text-center mb-8 font-nunito">
            Match with players from around the globe
          </p>
        </motion.div>

        {/* Search UI */}
        <AnimatePresence mode="wait">
          {!isSearching ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <GlassCard className="text-center" hover={false}>
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-uno-blue/20 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Globe className="w-12 h-12 text-uno-blue" />
                </motion.div>

                <h2 className="text-xl font-bold mb-2 font-nunito">
                  Ready to Play?
                </h2>
                <p className="text-muted-foreground mb-6 font-nunito">
                  Click below to find an opponent worldwide
                </p>

                <GameButton
                  variant="blue"
                  size="xl"
                  onClick={startSearch}
                  className="w-full"
                  icon={<Users className="w-5 h-5" />}
                >
                  Find Match
                </GameButton>

                <p className="text-sm text-muted-foreground mt-4 font-nunito">
                  🏆 Win = +500 XP
                </p>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="searching"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <GlassCard className="text-center" hover={false}>
                {/* Animated search */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-uno-blue/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-uno-green/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-uno-yellow/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-uno-blue/20 to-uno-green/20 flex items-center justify-center">
                    <Globe className="w-12 h-12 text-uno-blue" />
                  </div>
                </div>

                <h2 className="text-xl font-bold mb-2 font-nunito">
                  🔎 Searching for Online Players...
                </h2>
                <p className="text-muted-foreground mb-2 font-nunito">
                  Finding the best match for you
                </p>
                <p className="text-2xl font-bold text-uno-blue font-nunito mb-6">
                  {formatTime(searchTime)}
                </p>

                <GameButton
                  variant="red"
                  onClick={cancelSearch}
                  icon={<X className="w-5 h-5" />}
                >
                  Cancel Search
                </GameButton>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live indicator */}
        <motion.div
          className="glass rounded-xl px-6 py-4 text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2 h-2 bg-uno-green rounded-full animate-pulse" />
            <p className="text-muted-foreground text-sm font-nunito font-semibold">
              Live Matchmaking Active
            </p>
          </div>
          <p className="text-muted-foreground text-xs font-nunito">
            Players are matched in real-time based on availability
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GameWorldwide;
