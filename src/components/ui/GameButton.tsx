import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type GameButtonVariant = "red" | "blue" | "green" | "yellow" | "rainbow";

interface GameButtonProps {
  children: ReactNode;
  variant?: GameButtonVariant;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
  size?: "default" | "lg" | "xl";
  disabled?: boolean;
}

const variantStyles: Record<GameButtonVariant, string> = {
  red: "bg-gradient-to-br from-uno-red to-red-700 glow-pulse-red hover:from-red-500 hover:to-red-800",
  blue: "bg-gradient-to-br from-uno-blue to-blue-700 glow-pulse-blue hover:from-blue-400 hover:to-blue-800",
  green: "bg-gradient-to-br from-uno-green to-green-700 glow-pulse-green hover:from-green-400 hover:to-green-800",
  yellow: "bg-gradient-to-br from-uno-yellow to-yellow-600 glow-pulse-yellow hover:from-yellow-400 hover:to-yellow-700 text-gray-900",
  rainbow: "rainbow-border p-[3px]",
};

const sizeStyles = {
  default: "px-6 py-3 text-lg",
  lg: "px-8 py-4 text-xl",
  xl: "px-10 py-5 text-2xl",
};

export function GameButton({
  children,
  variant = "red",
  onClick,
  className,
  icon,
  size = "default",
  disabled = false,
}: GameButtonProps) {
  const isRainbow = variant === "rainbow";

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative font-nunito font-bold rounded-2xl transition-all duration-300",
        "flex items-center justify-center gap-3",
        "shadow-lg hover:shadow-2xl",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        !isRainbow && sizeStyles[size],
        className
      )}
    >
      {isRainbow ? (
        <span
          className={cn(
            "flex items-center justify-center gap-3 rounded-2xl bg-card w-full h-full",
            sizeStyles[size]
          )}
        >
          {icon && <span className="text-2xl">{icon}</span>}
          {children}
        </span>
      ) : (
        <>
          {icon && <span className="text-2xl">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
