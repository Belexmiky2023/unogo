import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, getCardDisplayValue, getCardColorClass } from "@/lib/unoCards";

interface UnoCardProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  isPlayable?: boolean;
  size?: "sm" | "md" | "lg";
  faceDown?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-12 h-16 text-lg",
  md: "w-16 h-24 text-xl",
  lg: "w-20 h-28 text-2xl",
};

export function UnoCard({
  card,
  onClick,
  disabled = false,
  isPlayable = false,
  size = "md",
  faceDown = false,
  className,
}: UnoCardProps) {
  const displayValue = getCardDisplayValue(card);
  const colorClass = faceDown ? "bg-gradient-to-br from-gray-800 to-gray-900" : getCardColorClass(card.color);

  return (
    <motion.button
      whileHover={!disabled && isPlayable ? { scale: 1.1, y: -10 } : undefined}
      whileTap={!disabled && isPlayable ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={disabled || !isPlayable}
      className={cn(
        "relative rounded-xl shadow-lg font-bold font-nunito flex items-center justify-center",
        "transition-all duration-200",
        "border-2 border-white/20",
        colorClass,
        sizeClasses[size],
        isPlayable && !disabled && "cursor-pointer ring-2 ring-accent ring-offset-2 ring-offset-background glow-yellow",
        disabled && "opacity-50 cursor-not-allowed",
        !isPlayable && !disabled && "cursor-default",
        className
      )}
    >
      {faceDown ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded-lg bg-gradient-to-br from-uno-red via-uno-yellow to-uno-blue opacity-50" />
        </div>
      ) : (
        <>
          {/* Card value */}
          <span className={cn(
            "drop-shadow-lg",
            card.color === "yellow" ? "text-gray-900" : "text-white"
          )}>
            {displayValue}
          </span>
          
          {/* Corner values */}
          <span className={cn(
            "absolute top-1 left-1.5 text-xs",
            card.color === "yellow" ? "text-gray-900" : "text-white"
          )}>
            {displayValue}
          </span>
          <span className={cn(
            "absolute bottom-1 right-1.5 text-xs rotate-180",
            card.color === "yellow" ? "text-gray-900" : "text-white"
          )}>
            {displayValue}
          </span>
          
          {/* White oval background */}
          <div className="absolute inset-2 bg-white/20 rounded-full -z-10 transform rotate-45" />
        </>
      )}
    </motion.button>
  );
}
