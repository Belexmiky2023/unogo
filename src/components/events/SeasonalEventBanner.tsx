import { motion } from "framer-motion";
import { Sparkles, Clock, Gift, Star } from "lucide-react";
import { useSeasonalEvents } from "@/hooks/useSeasonalEvents";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { Progress } from "@/components/ui/progress";

export function SeasonalEventBanner() {
  const { activeEvent, eventRewards, userProgress, loading, claimReward, getTimeRemaining } = useSeasonalEvents();

  if (loading) return null;
  if (!activeEvent) return null;

  const timeRemaining = getTimeRemaining();
  const userXP = userProgress?.event_xp || 0;
  const claimedRewards = userProgress?.rewards_claimed || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div
        className="glass rounded-2xl p-6 card-shine border-2 relative overflow-hidden"
        style={{ borderColor: activeEvent.theme_color }}
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${activeEvent.theme_color}40, transparent)`,
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" style={{ color: activeEvent.theme_color }} />
              <div>
                <h3 className="text-lg font-bold font-nunito">{activeEvent.name}</h3>
                <p className="text-sm text-muted-foreground">{activeEvent.description}</p>
              </div>
            </div>

            {/* Timer */}
            {timeRemaining && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm font-semibold">
                  {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                </span>
              </div>
            )}
          </div>

          {/* Event XP Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground font-nunito">Event Progress</span>
              <span className="font-semibold" style={{ color: activeEvent.theme_color }}>
                {userXP} XP
              </span>
            </div>
            <Progress
              value={eventRewards.length > 0 ? (userXP / Math.max(...eventRewards.map(r => r.xp_required), 1)) * 100 : 0}
              className="h-3"
            />
          </div>

          {/* Rewards */}
          {eventRewards.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold font-nunito flex items-center gap-2">
                <Gift className="w-4 h-4" style={{ color: activeEvent.theme_color }} />
                Event Rewards
              </h4>
              <div className="flex flex-wrap gap-2">
                {eventRewards.map(reward => {
                  const isUnlocked = userXP >= reward.xp_required;
                  const isClaimed = claimedRewards.includes(reward.id);

                  return (
                    <div
                      key={reward.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        isClaimed
                          ? 'bg-uno-green/20 border-uno-green/30'
                          : isUnlocked
                            ? 'bg-uno-yellow/20 border-uno-yellow/30'
                            : 'bg-muted/30 border-border opacity-60'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isUnlocked ? 'text-uno-yellow' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-nunito capitalize">{reward.reward_type}</span>
                      <span className="text-xs text-muted-foreground">({reward.xp_required} XP)</span>
                      
                      {isUnlocked && !isClaimed && (
                        <GameButton
                          variant="green"
                          size="sm"
                          onClick={() => claimReward(reward.id)}
                          className="ml-2 py-1 px-2 text-xs"
                        >
                          Claim
                        </GameButton>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
