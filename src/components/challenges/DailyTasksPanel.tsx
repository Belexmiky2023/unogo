import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Star, ListTodo, Zap, ExternalLink, Clock, Send, MessageCircle } from "lucide-react";
import { useDailyTasks } from "@/hooks/useDailyTasks";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function DailyTasksPanel() {
  const { tasks, userTasks, loading, claimReward, submitTask, isLinkBasedTask, totalAvailableXP, claimedXP } = useDailyTasks();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [telegramUsername, setTelegramUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'telegram':
        return <MessageCircle className="w-5 h-5 text-[#0088cc]" />;
      case 'external_link':
      case 'twitter':
      case 'discord':
      case 'youtube':
        return <ExternalLink className="w-5 h-5 text-uno-blue" />;
      default:
        return <Zap className="w-5 h-5 text-uno-yellow" />;
    }
  };

  const handleOpenLink = (task: typeof tasks[0]) => {
    if (task.task_link) {
      window.open(task.task_link, '_blank');
    }
    setSelectedTask(task.id);
    setShowSubmitDialog(true);
  };

  const handleSubmit = async () => {
    if (!selectedTask) return;
    
    const task = tasks.find(t => t.id === selectedTask);
    if (!task) return;

    setSubmitting(true);
    
    const submissionData: Record<string, unknown> = {};
    if (task.task_type === 'telegram' && telegramUsername) {
      submissionData.telegram_username = telegramUsername.replace('@', '');
    }

    await submitTask(selectedTask, submissionData);
    
    setSubmitting(false);
    setShowSubmitDialog(false);
    setTelegramUsername("");
    setSelectedTask(null);
  };

  const selectedTaskData = selectedTask ? tasks.find(t => t.id === selectedTask) : null;

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
            const isPending = progress?.submitted_at && !progress?.admin_approved;
            const isApproved = progress?.admin_approved || false;
            const progressPercent = (currentProgress / task.requirement_value) * 100;
            const isLinkTask = isLinkBasedTask(task.task_type);

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
                    : isCompleted && isApproved
                      ? "bg-uno-yellow/10 border-uno-yellow/30"
                      : isPending
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-muted/30 border-border"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-uno-green" />
                      ) : isPending ? (
                        <Clock className="w-5 h-5 text-orange-500" />
                      ) : (
                        getTaskIcon(task.task_type)
                      )}
                      <h4 className="font-semibold font-nunito">{task.title}</h4>
                      {isLinkTask && (
                        <span className="text-xs bg-uno-blue/20 text-uno-blue px-2 py-0.5 rounded capitalize">
                          {task.task_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    
                    {isLinkTask ? (
                      <div className="space-y-2">
                        {isPending && (
                          <div className="flex items-center gap-2 text-sm text-orange-500">
                            <Clock className="w-4 h-4" />
                            <span>Waiting for admin approval...</span>
                          </div>
                        )}
                        {isApproved && !isClaimed && (
                          <div className="flex items-center gap-2 text-sm text-uno-green">
                            <CheckCircle className="w-4 h-4" />
                            <span>Approved! Claim your reward.</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-uno-yellow font-semibold text-sm">
                            <Star className="w-4 h-4" />
                            {task.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {isLinkTask && !progress?.submitted_at && (
                      <GameButton
                        variant="blue"
                        size="sm"
                        onClick={() => handleOpenLink(task)}
                        icon={<ExternalLink className="w-4 h-4" />}
                      >
                        Go
                      </GameButton>
                    )}
                    
                    {isCompleted && isApproved && !isClaimed && (
                      <GameButton
                        variant="green"
                        size="sm"
                        onClick={() => claimReward(task.id)}
                      >
                        Claim
                      </GameButton>
                    )}

                    {!isLinkTask && isCompleted && !isClaimed && (
                      <GameButton
                        variant="green"
                        size="sm"
                        onClick={() => claimReward(task.id)}
                      >
                        Claim
                      </GameButton>
                    )}
                  </div>
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

      {/* Submit Task Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-nunito flex items-center gap-2">
              <Send className="w-5 h-5 text-uno-blue" />
              Complete Task
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedTaskData && (
              <>
                <p className="text-muted-foreground font-nunito">
                  Complete the task by clicking the link below, then confirm your submission.
                </p>
                
                {selectedTaskData.task_link && (
                  <a
                    href={selectedTaskData.task_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-uno-blue hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Task Link
                  </a>
                )}

                {selectedTaskData.task_type === 'telegram' && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Enter your Telegram username:
                    </label>
                    <Input
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value)}
                      placeholder="@username"
                      className="bg-muted border-border"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <GameButton
              variant="green"
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || (selectedTaskData?.task_type === 'telegram' && !telegramUsername)}
            >
              {submitting ? "Submitting..." : "I've Completed This Task"}
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
