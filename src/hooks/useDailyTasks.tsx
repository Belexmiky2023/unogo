import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  task_type: string;
  requirement_value: number;
  xp_reward: number;
  is_active: boolean;
  valid_date: string;
  task_link?: string | null;
  task_category?: string;
}

export interface UserDailyTask {
  id: string;
  task_id: string;
  current_progress: number;
  is_completed: boolean;
  xp_claimed: boolean;
  submitted_at?: string | null;
  admin_approved?: boolean;
  approved_at?: string | null;
  submission_data?: Record<string, unknown>;
}

export function useDailyTasks() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [userTasks, setUserTasks] = useState<UserDailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!profile) return;

    setLoading(true);

    const today = new Date().toISOString().split('T')[0];

    // Fetch today's active tasks
    const { data: tasksData } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('is_active', true)
      .eq('valid_date', today)
      .order('xp_reward', { ascending: false });

    if (tasksData) {
      setTasks(tasksData as DailyTask[]);
    }

    // Fetch user's task progress
    const { data: userProgressData } = await supabase
      .from('user_daily_tasks')
      .select('*')
      .eq('profile_id', profile.id);

    if (userProgressData) {
      setUserTasks(userProgressData as UserDailyTask[]);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Initialize user task if not exists
  const initializeTask = async (taskId: string) => {
    if (!profile) return null;

    const existing = userTasks.find(ut => ut.task_id === taskId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('user_daily_tasks')
      .insert({
        profile_id: profile.id,
        task_id: taskId,
        current_progress: 0,
      })
      .select()
      .single();

    if (!error && data) {
      const newProgress = data as UserDailyTask;
      setUserTasks(prev => [...prev, newProgress]);
      return newProgress;
    }
    return null;
  };

  // Submit a link-based task (telegram, external, etc.)
  const submitTask = async (taskId: string, submissionData: Record<string, unknown> = {}) => {
    if (!profile) return false;

    let userTask = userTasks.find(ut => ut.task_id === taskId);
    if (!userTask) {
      userTask = await initializeTask(taskId);
    }
    if (!userTask) return false;

    const { error } = await supabase
      .from('user_daily_tasks')
      .update({
        submitted_at: new Date().toISOString(),
        submission_data: submissionData,
        current_progress: 1,
      })
      .eq('id', userTask.id);

    if (!error) {
      setUserTasks(prev =>
        prev.map(ut =>
          ut.id === userTask!.id
            ? { ...ut, submitted_at: new Date().toISOString(), submission_data: submissionData, current_progress: 1 }
            : ut
        )
      );

      toast({
        title: "Task Submitted! 📝",
        description: "Waiting for admin approval...",
      });
      return true;
    }
    return false;
  };

  // Update task progress
  const updateProgress = async (taskId: string, increment: number = 1) => {
    if (!profile) return;

    let userTask = userTasks.find(ut => ut.task_id === taskId);
    if (!userTask) {
      userTask = await initializeTask(taskId);
    }
    if (!userTask || userTask.is_completed) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newProgress = Math.min(
      userTask.current_progress + increment,
      task.requirement_value
    );
    const isCompleted = newProgress >= task.requirement_value;

    const { error } = await supabase
      .from('user_daily_tasks')
      .update({
        current_progress: newProgress,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', userTask.id);

    if (!error) {
      setUserTasks(prev =>
        prev.map(ut =>
          ut.id === userTask!.id
            ? { ...ut, current_progress: newProgress, is_completed: isCompleted }
            : ut
        )
      );

      if (isCompleted) {
        toast({
          title: "✅ Task Complete!",
          description: `You completed "${task.title}"! Claim your ${task.xp_reward} XP.`,
        });
      }
    }
  };

  // Claim XP reward (only works for auto tasks or admin-approved tasks)
  const claimReward = async (taskId: string) => {
    if (!profile) return false;

    const userTask = userTasks.find(ut => ut.task_id === taskId);
    if (!userTask || !userTask.is_completed || userTask.xp_claimed) return false;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    // For link-based tasks, require admin approval
    const isLinkTask = ['telegram', 'twitter', 'discord', 'youtube', 'external_link'].includes(task.task_type);
    if (isLinkTask && !userTask.admin_approved) {
      toast({
        title: "Waiting for Approval",
        description: "This task requires admin approval before you can claim XP.",
        variant: "destructive",
      });
      return false;
    }

    // Update XP
    const { error: xpError } = await supabase
      .from('profiles')
      .update({ xp: profile.xp + task.xp_reward })
      .eq('id', profile.id);

    if (xpError) return false;

    // Mark as claimed
    const { error } = await supabase
      .from('user_daily_tasks')
      .update({ xp_claimed: true })
      .eq('id', userTask.id);

    if (!error) {
      setUserTasks(prev =>
        prev.map(ut =>
          ut.id === userTask.id ? { ...ut, xp_claimed: true } : ut
        )
      );

      toast({
        title: "XP Claimed! ⭐",
        description: `You earned ${task.xp_reward} XP!`,
      });
      return true;
    }
    return false;
  };

  // Get task with progress
  const getTaskWithProgress = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const progress = userTasks.find(ut => ut.task_id === taskId);
    return { task, progress };
  };

  // Check if task is a link-based task
  const isLinkBasedTask = (taskType: string) => {
    return ['telegram', 'twitter', 'discord', 'youtube', 'external_link'].includes(taskType);
  };

  // Calculate total available XP today
  const totalAvailableXP = tasks.reduce((sum, t) => sum + t.xp_reward, 0);
  const claimedXP = tasks.reduce((sum, t) => {
    const progress = userTasks.find(ut => ut.task_id === t.id);
    return sum + (progress?.xp_claimed ? t.xp_reward : 0);
  }, 0);

  return {
    tasks,
    userTasks,
    loading,
    fetchTasks,
    initializeTask,
    updateProgress,
    submitTask,
    claimReward,
    getTaskWithProgress,
    isLinkBasedTask,
    totalAvailableXP,
    claimedXP,
  };
}
