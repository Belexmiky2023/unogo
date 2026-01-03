import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { supabase } from "@/integrations/supabase/client";
import {
  GameState,
  Card,
  CardColor,
  initializeGame,
  playCard,
  drawCard,
  getAIMove,
} from "@/lib/unoCards";
import { GameBoard } from "@/components/game/GameBoard";
import { PlayerHand } from "@/components/game/PlayerHand";
import { OpponentHand } from "@/components/game/OpponentHand";
import { ColorPicker } from "@/components/game/ColorPicker";
import { UnoButton } from "@/components/game/UnoButton";
import { ShuffleAnimation, VictoryAnimation } from "@/components/game/CardAnimations";
import { GameButton } from "@/components/ui/GameButton";
import { GlassCard } from "@/components/ui/GlassCard";
import unogoLogo from "@/assets/unogo-logo.png";

const GameAI = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const {
    soundEnabled,
    toggleSound,
    playCardSound,
    playDrawSound,
    playUnoSound,
    playVictorySound,
    playTurnSound,
    playPenaltySound,
    playShuffleSound,
    playDealSound,
  } = useSoundEffects();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [aiCount, setAICount] = useState<number | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState<Card | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isDealing, setIsDealing] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [hasCalledUno, setHasCalledUno] = useState(false);
  const [showUnoButton, setShowUnoButton] = useState(false);
  const [unoPenaltyApplied, setUnoPenaltyApplied] = useState(false);
  const prevPlayerIndexRef = useRef<number>(0);

  // Initialize game
  const startGame = useCallback((numAI: number) => {
    setIsShuffling(true);
    playShuffleSound();
    
    setTimeout(() => {
      setIsShuffling(false);
      setIsDealing(true);
      
      const playerName = profile?.username || "You";
      const state = initializeGame([playerName], numAI);
      setGameState(state);
      setAICount(numAI);
      setShowGameOver(false);
      setShowVictory(false);
      setHasCalledUno(false);
      setUnoPenaltyApplied(false);
      
      // Play deal sounds
      const totalCards = (numAI + 1) * 7;
      for (let i = 0; i < totalCards; i++) {
        setTimeout(() => playDealSound(), i * 80);
      }
      
      setTimeout(() => setIsDealing(false), totalCards * 80 + 500);
    }, 1500);
  }, [profile, playShuffleSound, playDealSound]);

  // Check if player should show UNO button
  useEffect(() => {
    if (!gameState || gameState.gameOver) return;
    
    const humanPlayer = gameState.players[0];
    const isHumanTurn = gameState.currentPlayerIndex === 0;
    
    // Show UNO button when player has 2 cards and it's their turn
    if (humanPlayer.hand.length === 2 && isHumanTurn && !hasCalledUno) {
      setShowUnoButton(true);
    } else if (humanPlayer.hand.length !== 2 || hasCalledUno) {
      setShowUnoButton(false);
    }
  }, [gameState, hasCalledUno]);

  // Apply UNO penalty if player didn't call UNO
  useEffect(() => {
    if (!gameState || gameState.gameOver || unoPenaltyApplied) return;
    
    const humanPlayer = gameState.players[0];
    const isHumanTurn = gameState.currentPlayerIndex === 0;
    
    // If player has 1 card, wasn't their turn, and didn't call UNO - penalty!
    if (humanPlayer.hand.length === 1 && !hasCalledUno && !isHumanTurn && !unoPenaltyApplied) {
      // Draw 2 cards as penalty
      let newState = gameState;
      for (let i = 0; i < 2; i++) {
        newState = drawCard(newState, 0);
      }
      setGameState(newState);
      setUnoPenaltyApplied(true);
      playPenaltySound();
    }
  }, [gameState, hasCalledUno, unoPenaltyApplied, playPenaltySound]);

  // Handle UNO call
  const handleUnoCall = useCallback(() => {
    setHasCalledUno(true);
    setShowUnoButton(false);
    playUnoSound();
  }, [playUnoSound]);

  // Handle AI turns
  useEffect(() => {
    if (!gameState || gameState.gameOver || isDealing) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Play turn sound when turn changes
    if (prevPlayerIndexRef.current !== gameState.currentPlayerIndex) {
      playTurnSound();
      prevPlayerIndexRef.current = gameState.currentPlayerIndex;
    }
    
    if (currentPlayer.isAI) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(gameState, gameState.currentPlayerIndex);
        
        if (aiMove.action === "play" && aiMove.card) {
          playCardSound();
          setGameState(playCard(gameState, gameState.currentPlayerIndex, aiMove.card, aiMove.chosenColor));
        } else {
          playDrawSound();
          setGameState(drawCard(gameState, gameState.currentPlayerIndex));
        }
      }, 1000 + Math.random() * 500);

      return () => clearTimeout(timer);
    }
  }, [gameState, isDealing, playCardSound, playDrawSound, playTurnSound]);

  // Check for game over
  useEffect(() => {
    if (gameState?.gameOver && !showGameOver) {
      setShowGameOver(true);
      setShowVictory(true);
      
      const isWinner = gameState.winner && !gameState.winner.isAI;
      if (isWinner) {
        playVictorySound();
      }
      
      // Award XP for winning
      if (isWinner && user && profile) {
        const awardXP = async () => {
          const { error } = await supabase
            .from("profiles")
            .update({
              xp: profile.xp + 100,
              wins: profile.wins + 1,
              games_played: profile.games_played + 1,
            })
            .eq("id", profile.id);

          if (!error) {
            refreshProfile();
          }
        };
        awardXP();
      } else if (user && profile) {
        // Update stats for loss
        const updateStats = async () => {
          await supabase
            .from("profiles")
            .update({
              losses: profile.losses + 1,
              games_played: profile.games_played + 1,
            })
            .eq("id", profile.id);
          refreshProfile();
        };
        updateStats();
      }
    }
  }, [gameState?.gameOver, showGameOver, gameState?.winner, user, profile, refreshProfile, playVictorySound]);

  // Handle playing a card
  const handlePlayCard = (card: Card) => {
    if (!gameState) return;

    // Reset UNO state when playing a card
    if (gameState.players[0].hand.length === 2) {
      // If they have 2 cards and play one, check if they called UNO
      if (!hasCalledUno) {
        setUnoPenaltyApplied(false); // Reset for next round
      }
    }

    // Check if wild card needs color selection
    if (card.color === "black") {
      setPendingCard(card);
      setShowColorPicker(true);
      return;
    }

    playCardSound();
    setGameState(playCard(gameState, 0, card));
  };

  // Handle color selection for wild cards
  const handleColorSelect = (color: CardColor) => {
    if (!gameState || !pendingCard) return;

    playCardSound();
    setGameState(playCard(gameState, 0, pendingCard, color));
    setShowColorPicker(false);
    setPendingCard(null);
  };

  // Handle drawing a card
  const handleDrawCard = () => {
    if (!gameState) return;
    playDrawSound();
    setGameState(drawCard(gameState, 0));
  };

  // AI count selection
  if (aiCount === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={() => navigate("/play")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-nunito font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <img src={unogoLogo} alt="UNOGO" className="w-40 mx-auto mb-6" />
          
          <h2 className="text-2xl font-bold mb-2 font-nunito">Play vs AI</h2>
          <p className="text-muted-foreground mb-8 font-nunito">
            How many robots do you want to play against?
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {[1, 2, 3].map((num) => (
              <GameButton
                key={num}
                variant={num === 1 ? "green" : num === 2 ? "blue" : "red"}
                size="lg"
                onClick={() => startGame(num)}
              >
                {num} Bot{num > 1 ? "s" : ""}
              </GameButton>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!gameState) return null;

  const humanPlayer = gameState.players[0];
  const isHumanTurn = gameState.currentPlayerIndex === 0;
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const isWinner = gameState.winner && !gameState.winner.isAI;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950" />

      {/* Shuffle Animation */}
      <ShuffleAnimation isShuffling={isShuffling} />

      {/* Victory Animation */}
      <VictoryAnimation
        show={showVictory && !showGameOver}
        isWinner={!!isWinner}
        winnerName={gameState.winner?.name || ""}
        xpGained={isWinner ? 100 : undefined}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <button
          onClick={() => navigate("/play")}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-nunito font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Exit
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleSound}
            className="text-white/70 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-between py-4 px-4">
        {/* Opponents at top */}
        <div className="flex justify-center gap-8 flex-wrap">
          {gameState.players.slice(1).map((player, index) => (
            <OpponentHand
              key={player.id}
              cards={player.hand}
              name={player.name}
              isCurrentPlayer={gameState.currentPlayerIndex === index + 1}
              position="top"
            />
          ))}
        </div>

        {/* Game board in center */}
        <div className="flex-1 flex items-center justify-center">
          <GameBoard
            discardPile={gameState.discardPile}
            drawPileCount={gameState.drawPile.length}
            currentColor={gameState.currentColor}
            direction={gameState.direction}
            onDrawCard={handleDrawCard}
            isCurrentPlayer={isHumanTurn}
          />
        </div>

        {/* Player info */}
        <div className="text-center mb-4">
          <p className={`font-bold font-nunito text-lg ${isHumanTurn ? "text-uno-yellow" : "text-white/70"}`}>
            {isHumanTurn ? "Your Turn!" : `${gameState.players[gameState.currentPlayerIndex].name}'s Turn`}
          </p>
          <p className="text-white/50 text-sm font-nunito">{humanPlayer.hand.length} cards</p>
          {hasCalledUno && humanPlayer.hand.length <= 2 && (
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-uno-red font-bold font-nunito"
            >
              UNO! 🎉
            </motion.p>
          )}
        </div>

        {/* Player's hand */}
        <div className="flex justify-center overflow-x-auto pb-4 w-full max-w-full">
          <PlayerHand
            cards={humanPlayer.hand}
            topCard={topCard}
            currentColor={gameState.currentColor}
            isCurrentPlayer={isHumanTurn}
            onPlayCard={handlePlayCard}
          />
        </div>
      </div>

      {/* UNO Button */}
      <UnoButton visible={showUnoButton} onClick={handleUnoCall} />

      {/* Color picker */}
      <ColorPicker isOpen={showColorPicker} onSelectColor={handleColorSelect} />

      {/* Game over modal */}
      <AnimatePresence>
        {showGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <GlassCard className="text-center max-w-sm mx-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <Trophy className={`w-16 h-16 mx-auto mb-4 ${isWinner ? "text-uno-yellow" : "text-muted-foreground"}`} />
              </motion.div>

              <h2 className="text-3xl font-bold mb-2 font-nunito">
                {isWinner ? "You Win!" : "Game Over"}
              </h2>
              <p className="text-muted-foreground mb-4 font-nunito">
                {isWinner
                  ? "Congratulations! +100 XP"
                  : `${gameState.winner?.name} won the game`}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GameButton
                  variant="green"
                  onClick={() => startGame(aiCount)}
                  icon={<RotateCcw className="w-5 h-5" />}
                >
                  Play Again
                </GameButton>
                <GameButton variant="blue" onClick={() => navigate("/play")}>
                  Back to Menu
                </GameButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameAI;
