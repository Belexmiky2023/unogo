import { motion, AnimatePresence } from "framer-motion";
import { CardColor, Card, getCardColorClass } from "@/lib/unoCards";
import { UnoCard } from "./UnoCard";

interface GameBoardProps {
  discardPile: Card[];
  drawPileCount: number;
  currentColor: CardColor;
  direction: 1 | -1;
  onDrawCard: () => void;
  isCurrentPlayer: boolean;
}

export function GameBoard({
  discardPile,
  drawPileCount,
  currentColor,
  direction,
  onDrawCard,
  isCurrentPlayer,
}: GameBoardProps) {
  const topCard = discardPile[discardPile.length - 1];
  const colorClass = getCardColorClass(currentColor);

  return (
    <div className="flex items-center justify-center gap-8">
      {/* Draw pile */}
      <motion.button
        whileHover={isCurrentPlayer ? { scale: 1.05 } : undefined}
        whileTap={isCurrentPlayer ? { scale: 0.95 } : undefined}
        onClick={onDrawCard}
        disabled={!isCurrentPlayer}
        className={`relative ${isCurrentPlayer ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="relative">
          {/* Stack effect */}
          <div className="absolute top-1 left-1 w-20 h-28 rounded-xl bg-gray-700 shadow-lg" />
          <div className="absolute top-0.5 left-0.5 w-20 h-28 rounded-xl bg-gray-800 shadow-lg" />
          
          <div className="w-20 h-28 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl flex items-center justify-center border-2 border-white/20">
            <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-uno-red via-uno-yellow to-uno-blue opacity-60" />
          </div>
        </div>
        
        <p className="text-center mt-2 text-muted-foreground text-sm font-nunito">
          {drawPileCount} left
        </p>
        
        {isCurrentPlayer && (
          <motion.p
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-uno-yellow text-xs font-nunito font-bold whitespace-nowrap"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Click to draw
          </motion.p>
        )}
      </motion.button>

      {/* Discard pile */}
      <div className="relative">
        {/* Direction indicator */}
        <motion.div
          className="absolute -top-12 left-1/2 -translate-x-1/2 text-3xl"
          animate={{ rotate: direction === 1 ? 0 : 180 }}
          transition={{ type: "spring" }}
        >
          <span className="text-white/50">⟳</span>
        </motion.div>

        {/* Previous cards (stack effect) */}
        {discardPile.slice(-3, -1).map((card, i) => (
          <motion.div
            key={card.id}
            className="absolute"
            style={{
              top: (2 - i) * 2,
              left: (2 - i) * 2,
              opacity: 0.5 - i * 0.2,
              zIndex: i,
            }}
          >
            <UnoCard card={card} size="lg" isPlayable={false} />
          </motion.div>
        ))}

        {/* Top card */}
        <AnimatePresence mode="popLayout">
          {topCard && (
            <motion.div
              key={topCard.id}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="relative z-10"
            >
              <UnoCard card={topCard} size="lg" isPlayable={false} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current color indicator */}
        <motion.div
          className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${colorClass} shadow-lg border-2 border-white/30`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    </div>
  );
}
