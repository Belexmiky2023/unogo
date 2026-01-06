import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TaskSubmission {
  id: string;
  task_id: string;
  profile_id: string;
  current_progress: number;
  is_completed: boolean;
  xp_claimed: boolean;
  submitted_at?: string | null;
  admin_approved?: boolean;
  approved_at?: string | null;
  submission_data?: Record<string, unknown>;
  completed_at?: string | null;
  created_at?: string;
  // Joined data
  profile_username?: string;
  profile_display_name?: string | null;
  task_title?: string;
  task_type?: string;
  task_xp_reward?: number;
}

export function useAdminTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingSubmissions, setPendingSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingSubmissions = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Get user_daily_tasks with submitted_at
      const { data: submissionsData, error: subError } = await supabase
        .from('user_daily_tasks')
        .select('*')
        .not('submitted_at', 'is', null);

      if (subError || !submissionsData) {
        setLoading(false);
        return;
      }

      // Cast to our extended type and filter for not approved
      const typedData = submissionsData as unknown as TaskSubmission[];
      const pendingData = typedData.filter(s => s.admin_approved === false);

      // Get profile and task data for each submission
      const enrichedSubmissions: TaskSubmission[] = [];
      
      for (const sub of pendingData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('id', sub.profile_id)
          .single();
        
        const { data: taskData } = await supabase
          .from('daily_tasks')
          .select('title, task_type, xp_reward')
          .eq('id', sub.task_id)
          .single();
        
        enrichedSubmissions.push({
          ...sub,
          profile_username: profileData?.username,
          profile_display_name: profileData?.display_name,
          task_title: taskData?.title,
          task_type: taskData?.task_type,
          task_xp_reward: taskData?.xp_reward,
        });
      }

      // Sort by submitted_at
      enrichedSubmissions.sort((a, b) => {
        const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
        return aTime - bTime;
      });

      setPendingSubmissions(enrichedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPendingSubmissions();
  }, [fetchPendingSubmissions]);

  const approveSubmission = async (submissionId: string) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (!submission) return false;

    // Update to approved and completed
    const { error } = await supabase
      .from('user_daily_tasks')
      .update({
        admin_approved: true,
        approved_at: new Date().toISOString(),
        is_completed: true,
      })
      .eq('id', submissionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve submission",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Approved! ✅",
      description: `Task approved for @${submission.profile_username}`,
    });

    await fetchPendingSubmissions();
    return true;
  };

  const rejectSubmission = async (submissionId: string) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (!submission) return false;

    // Reset submission
    const { error } = await supabase
      .from('user_daily_tasks')
      .update({
        submitted_at: null,
        submission_data: {},
        current_progress: 0,
      })
      .eq('id', submissionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject submission",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Rejected",
      description: `Submission rejected for @${submission.profile_username}`,
    });

    await fetchPendingSubmissions();
    return true;
  };

  return {
    pendingSubmissions,
    loading,
    fetchPendingSubmissions,
    approveSubmission,
    rejectSubmission,
  };
}
