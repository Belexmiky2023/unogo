import { motion } from 'framer-motion';
import { useLevelSystem } from '@/hooks/useLevelSystem';
import { RankBadge } from './RankBadge';

export function LevelProgress() {
  const { getUserLevelInfo, loading } = useLevelSystem();
  const levelInfo = getUserLevelInfo();

  if (loading || !levelInfo) return null;

  const { xp, level, progress, nextLevelXp, currentRank } = levelInfo;

  return (
    <div className="space-y-4">
      {/* Level & Rank */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentRank && <RankBadge rank={currentRank} />}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-nunito">Level {level}</p>
          <p className="text-muted-foreground text-sm font-nunito">
            {xp.toLocaleString()} XP
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground font-nunito">
          <span>Progress to Level {level + 1}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-uno-green via-uno-blue to-uno-yellow"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-muted-foreground font-nunito text-right">
          {nextLevelXp.toLocaleString()} XP needed
        </p>
      </div>
    </div>
  );
}
