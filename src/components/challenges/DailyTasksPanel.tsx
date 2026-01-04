import { motion } from "framer-motion";
import { CheckCircle, Star, ListTodo, Zap } from "lucide-react";
import { useDailyTasks } from "@/hooks/useDailyTasks";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function DailyTasksPanel() {
  const { tasks, userTasks, loading, claimReward, totalAvailableXP, claimedXP } = useDailyTasks();

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading daily tasks...
      </div>
    );
  }

  const getTaskProgress = (taskId: string) => {
    return userTasks.find(ut => ut.task_id === taskId);
  };

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-uno-blue" />
          <h3 className="text-lg font-bold font-nunito">Today's Tasks</h3>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 text-uno-yellow" />
          <span className="font-semibold">
            {claimedXP}/{totalAvailableXP} XP
          </span>
        </div>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const progress = getTaskProgress(task.id);
            const currentProgress = progress?.current_progress || 0;
            const isCompleted = progress?.is_completed || false;
            const isClaimed = progress?.xp_claimed || false;
            const progressPercent = (currentProgress / task.requirement_value) * 100;

            return (
              <motion.div
                key={task.id}
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
                        <Zap className="w-5 h-5 text-uno-yellow" />
                      )}
                      <h4 className="font-semibold font-nunito">{task.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {currentProgress} / {task.requirement_value}
                        </span>
                        <span className="flex items-center gap-1 text-uno-yellow font-semibold">
                          <Star className="w-4 h-4" />
                          {task.xp_reward} XP
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  </div>

                  {isCompleted && !isClaimed && (
                    <GameButton
                      variant="green"
                      size="sm"
                      onClick={() => claimReward(task.id)}
                    >
                      Claim
                    </GameButton>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <GlassCard className="text-center py-6" hover={false}>
          <ListTodo className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground font-nunito">
            No daily tasks available today
          </p>
          <p className="text-sm text-muted-foreground font-nunito">
            Check back tomorrow!
          </p>
        </GlassCard>
      )}
    </div>
  );
}
