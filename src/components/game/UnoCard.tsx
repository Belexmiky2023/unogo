import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, getCardDisplayValue } from "@/lib/unoCards";

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
  sm: "w-14 h-20",
  md: "w-20 h-28",
  lg: "w-24 h-36",
};

const fontSizes = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-4xl",
};

const cornerSizes = {
  sm: "text-[8px]",
  md: "text-xs",
  lg: "text-sm",
};

const getCardColors = (color: Card['color']) => {
  switch (color) {
    case 'red':
      return {
        bg: 'bg-[#ED1C24]',
        shadow: 'shadow-[0_4px_20px_rgba(237,28,36,0.5)]',
        glow: 'hover:shadow-[0_8px_30px_rgba(237,28,36,0.7)]',
      };
    case 'blue':
      return {
        bg: 'bg-[#0087DC]',
        shadow: 'shadow-[0_4px_20px_rgba(0,135,220,0.5)]',
        glow: 'hover:shadow-[0_8px_30px_rgba(0,135,220,0.7)]',
      };
    case 'green':
      return {
        bg: 'bg-[#00A650]',
        shadow: 'shadow-[0_4px_20px_rgba(0,166,80,0.5)]',
        glow: 'hover:shadow-[0_8px_30px_rgba(0,166,80,0.7)]',
      };
    case 'yellow':
      return {
        bg: 'bg-[#FFCC00]',
        shadow: 'shadow-[0_4px_20px_rgba(255,204,0,0.5)]',
        glow: 'hover:shadow-[0_8px_30px_rgba(255,204,0,0.7)]',
      };
    case 'black':
      return {
        bg: 'bg-[#1A1A1A]',
        shadow: 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]',
        glow: 'hover:shadow-[0_8px_30px_rgba(100,100,100,0.5)]',
      };
    default:
      return {
        bg: 'bg-gray-500',
        shadow: '',
        glow: '',
      };
  }
};

const getSymbolForCard = (value: string) => {
  switch (value) {
    case 'skip':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"/>
          <line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" strokeWidth="8"/>
        </svg>
      );
    case 'reverse':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M25 50 L50 25 L50 40 L75 40 L75 60 L50 60 L50 75 Z" fill="currentColor"/>
          <path d="M75 50 L50 75 L50 60 L25 60 L25 40 L50 40 L50 25 Z" fill="currentColor" transform="rotate(180 50 50)"/>
        </svg>
      );
    case 'draw2':
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-6 h-8 border-2 border-current rounded-sm bg-current/20 -rotate-6"/>
          <div className="w-6 h-8 border-2 border-current rounded-sm bg-current/20 rotate-6 -mt-6"/>
          <span className="font-black text-lg mt-1">+2</span>
        </div>
      );
    case 'wild':
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-full overflow-hidden" style={{
            background: 'conic-gradient(#ED1C24 0deg 90deg, #FFCC00 90deg 180deg, #00A650 180deg 270deg, #0087DC 270deg 360deg)'
          }}/>
        </div>
      );
    case 'wild_draw4':
      return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div className="absolute w-14 h-14 rounded-full overflow-hidden -translate-y-2" style={{
            background: 'conic-gradient(#ED1C24 0deg 90deg, #FFCC00 90deg 180deg, #00A650 180deg 270deg, #0087DC 270deg 360deg)'
          }}/>
          <span className="font-black text-lg text-white relative z-10 mt-8">+4</span>
        </div>
      );
    default:
      return null;
  }
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
  const colors = getCardColors(faceDown ? 'black' : card.color);
  const isNumberCard = !['skip', 'reverse', 'draw2', 'wild', 'wild_draw4'].includes(card.value);
  const isWild = card.color === 'black';
  const textColor = card.color === 'yellow' ? 'text-black' : 'text-white';

  return (
    <motion.button
      whileHover={!disabled && isPlayable ? { scale: 1.08, y: -12, rotate: 2 } : undefined}
      whileTap={!disabled && isPlayable ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={disabled || !isPlayable}
      className={cn(
        "relative rounded-xl font-black font-nunito flex items-center justify-center",
        "transition-all duration-300 transform-gpu",
        "border-4 border-white",
        colors.bg,
        colors.shadow,
        isPlayable && !disabled && colors.glow,
        sizeClasses[size],
        isPlayable && !disabled && "cursor-pointer ring-2 ring-accent ring-offset-2 ring-offset-background animate-pulse",
        disabled && "opacity-50 cursor-not-allowed",
        !isPlayable && !disabled && "cursor-default",
        className
      )}
      style={{
        perspective: '1000px',
      }}
    >
      {faceDown ? (
        // Card back design - UNO logo style
        <div className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden">
          <div className="absolute inset-1 rounded-lg bg-black flex items-center justify-center">
            <div className="relative">
              {/* UNO ellipse */}
              <div 
                className="w-14 h-8 rounded-[100%] bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center transform -rotate-12"
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
              >
                <span className="text-white font-black text-sm italic tracking-tight">UNO</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* White ellipse background */}
          <div 
            className="absolute inset-2 bg-white rounded-[50%] transform rotate-[30deg]"
            style={{
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
          
          {/* Center content */}
          <div className={cn(
            "relative z-10 flex items-center justify-center",
            textColor,
            fontSizes[size]
          )}>
            {isNumberCard ? (
              <span 
                className="font-black drop-shadow-lg"
                style={{
                  textShadow: card.color === 'yellow' 
                    ? 'none' 
                    : '2px 2px 0 rgba(0,0,0,0.3), -1px -1px 0 rgba(255,255,255,0.2)',
                  WebkitTextStroke: card.color === 'yellow' ? '1px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                {displayValue}
              </span>
            ) : (
              <div className={cn(
                "flex items-center justify-center",
                size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16',
                !isWild && textColor
              )}>
                {getSymbolForCard(card.value)}
              </div>
            )}
          </div>
          
          {/* Top-left corner */}
          <div className={cn(
            "absolute top-1 left-1.5 flex flex-col items-center",
            cornerSizes[size],
            textColor
          )}>
            <span className="font-black leading-none drop-shadow">{displayValue}</span>
          </div>
          
          {/* Bottom-right corner (rotated 180°) */}
          <div className={cn(
            "absolute bottom-1 right-1.5 flex flex-col items-center rotate-180",
            cornerSizes[size],
            textColor
          )}>
            <span className="font-black leading-none drop-shadow">{displayValue}</span>
          </div>
        </>
      )}
    </motion.button>
  );
}