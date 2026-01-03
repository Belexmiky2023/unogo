import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface DealingAnimationProps {
  children: ReactNode;
  index: number;
  isDealing: boolean;
}

export function DealingAnimation({ children, index, isDealing }: DealingAnimationProps) {
  return (
    <motion.div
      initial={isDealing ? { x: 0, y: -200, opacity: 0, rotate: -20 } : {}}
      animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
      transition={{
        delay: isDealing ? index * 0.1 : 0,
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
}

interface ShuffleAnimationProps {
  isShuffling: boolean;
  onComplete?: () => void;
}

export function ShuffleAnimation({ isShuffling, onComplete }: ShuffleAnimationProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isShuffling && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-50 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative w-40 h-56">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 w-16 h-24 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white/20"
                style={{ left: "50%", top: "50%", marginLeft: -32, marginTop: -48 }}
                animate={{
                  x: [0, (i % 2 === 0 ? 1 : -1) * 40, 0],
                  y: [0, (i % 3 === 0 ? 1 : -1) * 20, 0],
                  rotate: [0, (i % 2 === 0 ? 1 : -1) * 15, 0],
                }}
                transition={{
                  duration: 0.3,
                  repeat: 3,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <motion.p
            className="absolute bottom-20 text-white font-nunito font-bold text-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            Shuffling...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface VictoryAnimationProps {
  show: boolean;
  isWinner: boolean;
  winnerName: string;
  xpGained?: number;
}

export function VictoryAnimation({ show, isWinner, winnerName, xpGained }: VictoryAnimationProps) {
  const confettiColors = ["#EF4444", "#3B82F6", "#22C55E", "#EAB308"];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Confetti */}
          {isWinner && (
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: confettiColors[i % confettiColors.length],
                    left: `${Math.random() * 100}%`,
                    top: -20,
                  }}
                  animate={{
                    y: [0, window.innerHeight + 50],
                    x: [0, (Math.random() - 0.5) * 200],
                    rotate: [0, Math.random() * 720],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: i * 0.02,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* Victory text */}
          <motion.div
            className="text-center"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <motion.h1
              className={`text-6xl font-black font-nunito mb-4 ${
                isWinner ? "text-uno-yellow" : "text-white"
              }`}
              style={{
                textShadow: isWinner
                  ? "0 0 30px hsl(45 100% 55% / 0.8)"
                  : "0 0 20px rgba(0,0,0,0.5)",
              }}
              animate={
                isWinner
                  ? {
                      scale: [1, 1.1, 1],
                    }
                  : {}
              }
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
            >
              {isWinner ? "🎉 YOU WIN! 🎉" : "Game Over"}
            </motion.h1>

            {!isWinner && (
              <motion.p
                className="text-2xl text-white/80 font-nunito"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {winnerName} wins!
              </motion.p>
            )}

            {isWinner && xpGained && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-3xl">⭐</span>
                <span className="text-2xl font-bold text-uno-yellow font-nunito">
                  +{xpGained} XP
                </span>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CardPlayAnimationProps {
  show: boolean;
  fromPosition?: { x: number; y: number };
  toPosition?: { x: number; y: number };
  children: ReactNode;
  onComplete?: () => void;
}

export function CardPlayAnimation({
  show,
  fromPosition = { x: 0, y: 200 },
  toPosition = { x: 0, y: 0 },
  children,
  onComplete,
}: CardPlayAnimationProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ 
            x: fromPosition.x, 
            y: fromPosition.y, 
            scale: 0.5, 
            opacity: 0,
            rotate: -15 
          }}
          animate={{ 
            x: toPosition.x, 
            y: toPosition.y, 
            scale: 1, 
            opacity: 1,
            rotate: 0 
          }}
          exit={{ 
            scale: 0.8, 
            opacity: 0 
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25 
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
