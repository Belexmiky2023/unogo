import { motion } from "framer-motion";
import { Trophy, Star, CheckCircle, Clock, Calendar, Zap } from "lucide-react";
import { useChallenges } from "@/hooks/useChallenges";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ChallengesPanel() {
  const { dailyChallenges, weeklyChallenges, userChallenges, loading, claimReward } = useChallenges();

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading challenges...
      </div>
    );
  }

  const getChallengeProgress = (challengeId: string) => {
    return userChallenges.find(uc => uc.challenge_id === challengeId);
  };

  const renderChallenge = (challenge: { id: string; title: string; description: string; requirement_value: number; xp_reward: number; challenge_type: string }, index: number) => {
    const progress = getChallengeProgress(challenge.id);
    const currentProgress = progress?.current_progress || 0;
    const isCompleted = progress?.is_completed || false;
    const isClaimed = progress?.xp_claimed || false;
    const progressPercent = (currentProgress / challenge.requirement_value) * 100;

    return (
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          "p-4 rounded-xl border transition-all",
          isCompleted && isClaimed
            ? "bg-uno-green/10 border-uno-green/30"
            : isCompleted
              ? "bg-uno-yellow/10 border-uno-yellow/30"
              : "bg-muted/30 border-border"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-uno-green" />
              ) : (
                <Trophy className="w-5 h-5 text-uno-yellow" />
              )}
              <h4 className="font-semibold font-nunito">{challenge.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {currentProgress} / {challenge.requirement_value}
                </span>
                <span className="flex items-center gap-1 text-uno-yellow font-semibold">
                  <Star className="w-4 h-4" />
                  {challenge.xp_reward} XP
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>

          {isCompleted && !isClaimed && (
            <GameButton
              variant="green"
              size="sm"
              onClick={() => claimReward(challenge.id)}
            >
              Claim
            </GameButton>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Daily Challenges */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-uno-blue" />
          <h3 className="text-lg font-bold font-nunito">Daily Challenges</h3>
        </div>
        {dailyChallenges.length > 0 ? (
          <div className="space-y-3">
            {dailyChallenges.map((challenge, index) => renderChallenge(challenge, index))}
          </div>
        ) : (
          <GlassCard className="text-center py-6" hover={false}>
            <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground font-nunito">
              No daily challenges available right now
            </p>
          </GlassCard>
        )}
      </div>

      {/* Weekly Challenges */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-uno-red" />
          <h3 className="text-lg font-bold font-nunito">Weekly Challenges</h3>
        </div>
        {weeklyChallenges.length > 0 ? (
          <div className="space-y-3">
            {weeklyChallenges.map((challenge, index) => renderChallenge(challenge, index))}
          </div>
        ) : (
          <GlassCard className="text-center py-6" hover={false}>
            <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground font-nunito">
              No weekly challenges available right now
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
