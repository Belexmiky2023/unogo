import { motion, AnimatePresence } from "framer-motion";
import { CardColor } from "@/lib/unoCards";

interface ColorPickerProps {
  isOpen: boolean;
  onSelectColor: (color: CardColor) => void;
}

const colors: { color: CardColor; bg: string; label: string }[] = [
  { color: "red", bg: "bg-uno-red glow-red", label: "Red" },
  { color: "blue", bg: "bg-uno-blue glow-blue", label: "Blue" },
  { color: "green", bg: "bg-uno-green glow-green", label: "Green" },
  { color: "yellow", bg: "bg-uno-yellow glow-yellow", label: "Yellow" },
];

export function ColorPicker({ isOpen, onSelectColor }: ColorPickerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <h3 className="text-2xl font-bold mb-6 font-nunito">Choose a Color</h3>
            <div className="grid grid-cols-2 gap-4">
              {colors.map(({ color, bg, label }) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectColor(color)}
                  className={`w-20 h-20 rounded-2xl ${bg} flex items-center justify-center shadow-lg`}
                >
                  <span className={`font-bold font-nunito ${color === "yellow" ? "text-gray-900" : "text-white"}`}>
                    {label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
