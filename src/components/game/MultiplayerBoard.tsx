import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, User, Crown, AlertCircle } from "lucide-react";
import { MultiplayerGame, GamePlayer } from "@/hooks/useMultiplayer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardColor, canPlayCard } from "@/lib/unoCards";
import { UnoCard } from "./UnoCard";
import { ColorPicker } from "./ColorPicker";
import { GameButton } from "@/components/ui/GameButton";
import { UnoButton } from "./UnoButton";

interface MultiplayerBoardProps {
  game: MultiplayerGame;
  onPlayCard: (card: Card, chosenColor?: CardColor) => void;
  onDrawCard: () => void;
  onCallUno?: () => void;
  onCatchUno?: (playerId: string) => void;
}

export function MultiplayerBoard({ game, onPlayCard, onDrawCard, onCallUno, onCatchUno }: MultiplayerBoardProps) {
  const { profile } = useAuth();
  const [selectedWildCard, setSelectedWildCard] = useState<Card | null>(null);
  
  const myPlayer = game.players.find(p => p.profile_id === profile?.id);
  const isMyTurn = myPlayer && game.current_player_index === myPlayer.player_index;
  const topCard = game.discard_pile[game.discard_pile.length - 1];
  const currentColor = game.current_color || 'red';

  const otherPlayers = game.players.filter(p => p.profile_id !== profile?.id);

  const handleCardClick = (card: Card) => {
    if (!isMyTurn) return;
    if (!canPlayCard(card, topCard, currentColor)) return;

    if (card.color === 'black') {
      setSelectedWildCard(card);
    } else {
      onPlayCard(card);
    }
  };

  const handleColorSelect = (color: CardColor) => {
    if (selectedWildCard) {
      onPlayCard(selectedWildCard, color);
      setSelectedWildCard(null);
    }
  };

  const getPlayableCards = () => {
    if (!myPlayer || !isMyTurn) return new Set<string>();
    return new Set(
      myPlayer.hand
        .filter(card => canPlayCard(card, topCard, currentColor))
        .map(card => card.id)
    );
  };

  const playableCardIds = getPlayableCards();

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Opponents at top */}
      <div className="flex justify-center gap-8 mb-8">
        {otherPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center"
          >
            <div className={`relative ${
              game.current_player_index === player.player_index
                ? 'ring-4 ring-uno-yellow ring-offset-2 ring-offset-background rounded-full'
                : ''
            }`}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-uno-red to-uno-blue flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              {player.player_index === 0 && (
                <Crown className="absolute -top-2 -right-2 w-5 h-5 text-uno-yellow" />
              )}
            </div>
            <p className="font-bold font-nunito mt-2 text-sm">@{player.username}</p>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-xs font-nunito">{player.hand.length} cards</p>
              {/* Catch UNO button - visible when opponent has 1 card and hasn't called UNO */}
              {player.hand.length === 1 && !player.has_called_uno && onCatchUno && (
                <button
                  onClick={() => onCatchUno(player.id)}
                  className="p-1 bg-uno-red text-white rounded-md text-xs font-bold animate-pulse flex items-center gap-1"
                  title="Catch! They didn't call UNO!"
                >
                  <AlertCircle className="w-3 h-3" />
                  Catch!
                </button>
              )}
              {player.has_called_uno && player.hand.length <= 2 && (
                <span className="px-2 py-0.5 bg-uno-yellow text-black rounded-full text-xs font-bold">
                  UNO!
                </span>
              )}
            </div>
            
            {/* Face down cards */}
            <div className="flex mt-2 -space-x-6">
              {player.hand.slice(0, 7).map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="w-8 h-12 rounded-md bg-black border-2 border-white flex items-center justify-center transform hover:-translate-y-1 transition-transform"
                  style={{ 
                    transform: `rotate(${(cardIndex - 3) * 5}deg)`,
                    zIndex: cardIndex 
                  }}
                >
                  <div className="w-5 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <span className="text-white text-[6px] font-black italic">UNO</span>
                  </div>
                </div>
              ))}
              {player.hand.length > 7 && (
                <span className="text-xs text-muted-foreground ml-2">+{player.hand.length - 7}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Game Board - Center */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Direction indicator */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2">
            <motion.div
              animate={{ rotate: game.direction === 1 ? 0 : 180 }}
              className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
            >
              {game.direction === 1 ? (
                <ArrowRight className="w-6 h-6 text-uno-yellow" />
              ) : (
                <ArrowLeft className="w-6 h-6 text-uno-yellow" />
              )}
            </motion.div>
          </div>

          {/* Discard pile */}
          <div className="flex items-center gap-8">
            {/* Draw pile */}
            <motion.button
              whileHover={isMyTurn ? { scale: 1.05 } : undefined}
              whileTap={isMyTurn ? { scale: 0.95 } : undefined}
              onClick={onDrawCard}
              disabled={!isMyTurn}
              className={`relative w-24 h-36 ${isMyTurn ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
            >
              <div className="absolute inset-0 bg-black rounded-xl border-4 border-white flex items-center justify-center">
                <div className="w-16 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center transform -rotate-12">
                  <span className="text-white text-lg font-black italic">UNO</span>
                </div>
              </div>
              <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-nunito whitespace-nowrap">
                {game.draw_pile.length} cards
              </p>
            </motion.button>

            {/* Top card */}
            <div className="relative">
              <UnoCard card={topCard} size="lg" isPlayable={false} />
              
              {/* Current color indicator */}
              <div 
                className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-white`}
                style={{
                  backgroundColor: 
                    currentColor === 'red' ? '#ED1C24' :
                    currentColor === 'blue' ? '#0087DC' :
                    currentColor === 'green' ? '#00A650' :
                    '#FFCC00'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* My Hand - Bottom */}
      <div className="mt-8">
        {/* Turn indicator */}
        <AnimatePresence>
          {isMyTurn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center mb-4"
            >
              <span className="inline-block px-6 py-2 bg-uno-yellow text-black font-bold font-nunito rounded-full animate-pulse">
                Your Turn!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards */}
        <div className="flex justify-center">
          <div className="flex gap-2 flex-wrap justify-center max-w-4xl">
            {myPlayer?.hand.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <UnoCard
                  card={card}
                  size="md"
                  isPlayable={playableCardIds.has(card.id)}
                  disabled={!isMyTurn}
                  onClick={() => handleCardClick(card)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* UNO Call Button - show when player has 1 or 2 cards */}
        {myPlayer && myPlayer.hand.length <= 2 && !myPlayer.has_called_uno && onCallUno && (
          <UnoButton visible={true} onClick={onCallUno} />
        )}
        
        {/* UNO Called indicator */}
        {myPlayer?.has_called_uno && myPlayer.hand.length <= 2 && (
          <div className="flex justify-center mt-4">
            <span className="px-4 py-2 bg-uno-yellow text-black rounded-full font-bold font-nunito animate-pulse">
              You called UNO! 🎉
            </span>
          </div>
        )}

        {/* No playable cards message */}
        {isMyTurn && playableCardIds.size === 0 && (
          <div className="text-center mt-4">
            <p className="text-muted-foreground font-nunito">No playable cards!</p>
            <GameButton
              variant="blue"
              className="mt-2"
              onClick={onDrawCard}
            >
              Draw a Card
            </GameButton>
          </div>
        )}
      </div>

      {/* Color Picker Modal */}
      <ColorPicker
        isOpen={!!selectedWildCard}
        onSelectColor={(color) => {
          handleColorSelect(color);
          setSelectedWildCard(null);
        }}
      />
    </div>
  );
}