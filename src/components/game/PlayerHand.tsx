import { motion } from "framer-motion";
import { Card, CardColor, canPlayCard } from "@/lib/unoCards";
import { UnoCard } from "./UnoCard";

interface PlayerHandProps {
  cards: Card[];
  topCard: Card;
  currentColor: CardColor;
  isCurrentPlayer: boolean;
  onPlayCard: (card: Card) => void;
}

export function PlayerHand({
  cards,
  topCard,
  currentColor,
  isCurrentPlayer,
  onPlayCard,
}: PlayerHandProps) {
  const cardWidth = 64; // w-16 = 4rem = 64px
  const overlap = cards.length > 10 ? 30 : 40;
  const totalWidth = cardWidth + (cards.length - 1) * overlap;

  return (
    <div className="relative" style={{ width: totalWidth, height: 96 }}>
      {cards.map((card, index) => {
        const isPlayable = isCurrentPlayer && canPlayCard(card, topCard, currentColor);
        
        return (
          <motion.div
            key={card.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ delay: index * 0.05 }}
            className="absolute"
            style={{
              left: index * overlap,
              zIndex: index,
            }}
          >
            <UnoCard
              card={card}
              isPlayable={isPlayable}
              disabled={!isCurrentPlayer}
              onClick={() => isPlayable && onPlayCard(card)}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
