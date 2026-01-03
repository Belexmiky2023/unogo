import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UnoButtonProps {
  visible: boolean;
  onClick: () => void;
  className?: string;
}

export function UnoButton({ visible, onClick, className }: UnoButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClick}
          className={cn(
            "fixed bottom-32 right-4 z-50",
            "w-20 h-20 rounded-full",
            "bg-gradient-to-br from-uno-red to-red-700",
            "border-4 border-white shadow-2xl",
            "flex items-center justify-center",
            "font-nunito font-black text-white text-xl",
            "animate-pulse",
            "hover:from-red-600 hover:to-red-800",
            className
          )}
          style={{
            boxShadow:
              "0 0 30px hsl(0 84% 60% / 0.6), inset 0 2px 10px rgba(255,255,255,0.3)",
          }}
        >
          <span className="drop-shadow-lg">UNO!</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
