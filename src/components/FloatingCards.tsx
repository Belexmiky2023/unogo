import { motion } from "framer-motion";

const cards = [
  { color: "bg-uno-red", number: "7", rotation: -15, x: -120, y: -80 },
  { color: "bg-uno-blue", number: "3", rotation: 10, x: 130, y: -60 },
  { color: "bg-uno-green", number: "+2", rotation: -8, x: -100, y: 100 },
  { color: "bg-uno-yellow", number: "0", rotation: 20, x: 120, y: 80 },
];

export function FloatingCards() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          className={`absolute top-1/2 left-1/2 w-16 h-24 sm:w-20 sm:h-28 rounded-xl ${card.color} shadow-2xl flex items-center justify-center`}
          initial={{ 
            x: card.x, 
            y: card.y, 
            rotate: card.rotation,
            opacity: 0 
          }}
          animate={{ 
            x: [card.x, card.x + 10, card.x],
            y: [card.y, card.y - 15, card.y],
            rotate: card.rotation,
            opacity: 0.3
          }}
          transition={{
            duration: 4,
            delay: index * 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            filter: "blur(1px)",
          }}
        >
          <span className="text-white font-bold text-2xl sm:text-3xl drop-shadow-lg">
            {card.number}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
