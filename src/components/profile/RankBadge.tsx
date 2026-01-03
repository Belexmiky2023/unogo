import { motion } from 'framer-motion';
import { Rank, getBadgeColorClass, getRankGlowClass } from '@/lib/levelSystem';

interface RankBadgeProps {
  rank: Rank;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function RankBadge({ rank, size = 'md', showName = true }: RankBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-10 h-10 text-xl',
    lg: 'w-14 h-14 text-2xl',
  };

  const bgClass = getBadgeColorClass(rank.badge_color);
  const glowClass = getRankGlowClass(rank.badge_color);

  return (
    <motion.div 
      className="flex items-center gap-2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', bounce: 0.5 }}
    >
      <div
        className={`${sizeClasses[size]} ${bgClass} ${glowClass} rounded-full flex items-center justify-center`}
      >
        <span>{rank.icon}</span>
      </div>
      {showName && (
        <span className="font-bold font-nunito">{rank.name}</span>
      )}
    </motion.div>
  );
}
