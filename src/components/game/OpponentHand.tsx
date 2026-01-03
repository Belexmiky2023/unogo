import { motion } from "framer-motion";
import { Card } from "@/lib/unoCards";
import { UnoCard } from "./UnoCard";

interface OpponentHandProps {
  cards: Card[];
  name: string;
  isCurrentPlayer: boolean;
  position: "top" | "left" | "right";
}

export function OpponentHand({
  cards,
  name,
  isCurrentPlayer,
  position,
}: OpponentHandProps) {
  const cardCount = cards.length;
  const overlap = 20;
  
  const isVertical = position === "left" || position === "right";
  
  return (
    <div className={`flex flex-col items-center gap-2 ${isCurrentPlayer ? "animate-pulse" : ""}`}>
      <motion.div
        className={`relative ${isVertical ? "h-32" : ""}`}
        animate={isCurrentPlayer ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className={isVertical ? "absolute" : "inline-block"}
            style={
              isVertical
                ? { top: index * 15, zIndex: index }
                : { marginLeft: index === 0 ? 0 : -overlap, zIndex: index }
            }
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.02 }}
          >
            <UnoCard
              card={card}
              faceDown
              size="sm"
              isPlayable={false}
            />
          </motion.div>
        ))}
      </motion.div>
      
      <div className={`text-center ${isCurrentPlayer ? "text-uno-yellow" : "text-muted-foreground"}`}>
        <p className="font-bold font-nunito text-sm">{name}</p>
        <p className="text-xs font-nunito">{cardCount} cards</p>
      </div>
    </div>
  );
}
