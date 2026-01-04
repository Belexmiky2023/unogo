import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UserWithProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  xp: number;
  wins: number;
  losses: number;
  games_played: number;
  is_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: 'daily' | 'weekly';
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  is_active: boolean;
}

interface DailyTask {
  id: string;
  title: string;
  description: string;
  task_type: string;
  requirement_value: number;
  xp_reward: number;
  is_active: boolean;
  valid_date: string;
}

interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  theme_color: string;
  banner_image: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export function useAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [events, setEvents] = useState<SeasonalEvent[]>([]);

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!error && !!data);
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data as UserWithProfile[]);
    }
  }, [isAdmin]);

  // Fetch challenges
  const fetchChallenges = useCallback(async () => {
    if (!isAdmin) return;

    const { data } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setChallenges(data as Challenge[]);
    }
  }, [isAdmin]);

  // Fetch daily tasks
  const fetchDailyTasks = useCallback(async () => {
    if (!isAdmin) return;

    const { data } = await supabase
      .from("daily_tasks")
      .select("*")
      .order("valid_date", { ascending: false });

    if (data) {
      setDailyTasks(data as DailyTask[]);
    }
  }, [isAdmin]);

  // Fetch seasonal events
  const fetchEvents = useCallback(async () => {
    if (!isAdmin) return;

    const { data } = await supabase
      .from("seasonal_events")
      .select("*")
      .order("start_date", { ascending: false });

    if (data) {
      setEvents(data as SeasonalEvent[]);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchChallenges();
      fetchDailyTasks();
      fetchEvents();
    }
  }, [isAdmin, fetchUsers, fetchChallenges, fetchDailyTasks, fetchEvents]);

  // Add XP to a user
  const addXP = async (profileId: string, amount: number) => {
    if (!isAdmin) return false;

    const targetUser = users.find((u) => u.id === profileId);
    if (!targetUser) return false;

    const { error } = await supabase
      .from("profiles")
      .update({ xp: targetUser.xp + amount })
      .eq("id", profileId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add XP",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "XP Added!",
      description: `Added ${amount} XP to @${targetUser.username}`,
    });

    await fetchUsers();
    return true;
  };

  // Ban a user
  const banUser = async (profileId: string, reason: string) => {
    if (!isAdmin) return false;

    const targetUser = users.find((u) => u.id === profileId);
    if (!targetUser) return false;

    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: true, ban_reason: reason })
      .eq("id", profileId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "User Banned",
      description: `@${targetUser.username} has been banned`,
    });

    await fetchUsers();
    return true;
  };

  // Unban a user
  const unbanUser = async (profileId: string) => {
    if (!isAdmin) return false;

    const targetUser = users.find((u) => u.id === profileId);
    if (!targetUser) return false;

    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: false, ban_reason: null })
      .eq("id", profileId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "User Unbanned",
      description: `@${targetUser.username} has been unbanned`,
    });

    await fetchUsers();
    return true;
  };

  // Toggle verified status
  const toggleVerified = async (profileId: string) => {
    if (!isAdmin) return false;

    const targetUser = users.find((u) => u.id === profileId);
    if (!targetUser) return false;

    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: !targetUser.is_verified })
      .eq("id", profileId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update verification",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: targetUser.is_verified ? "Verification Removed" : "User Verified!",
      description: `@${targetUser.username} ${targetUser.is_verified ? "is no longer verified" : "is now verified"}`,
    });

    await fetchUsers();
    return true;
  };

  // Add new admin
  const addAdmin = async (userId: string) => {
    if (!isAdmin) return false;

    // Check if already admin
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (existing) {
      toast({
        title: "Already Admin",
        description: "This user is already an admin",
      });
      return false;
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add admin",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Admin Added!",
      description: "User is now an admin",
    });

    return true;
  };

  // Create a challenge
  const createChallenge = async (data: {
    title: string;
    description: string;
    challenge_type: 'daily' | 'weekly';
    requirement_type: string;
    requirement_value: number;
    xp_reward: number;
  }) => {
    if (!isAdmin) return false;

    const { error } = await supabase
      .from("challenges")
      .insert(data);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Challenge Created!",
      description: `"${data.title}" is now active`,
    });

    await fetchChallenges();
    return true;
  };

  // Toggle challenge active status
  const toggleChallengeActive = async (challengeId: string) => {
    if (!isAdmin) return false;

    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return false;

    const { error } = await supabase
      .from("challenges")
      .update({ is_active: !challenge.is_active })
      .eq("id", challengeId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update challenge",
        variant: "destructive",
      });
      return false;
    }

    await fetchChallenges();
    return true;
  };

  // Create a daily task
  const createDailyTask = async (data: {
    title: string;
    description: string;
    task_type: string;
    requirement_value: number;
    xp_reward: number;
    valid_date: string;
  }) => {
    if (!isAdmin) return false;

    const { error } = await supabase
      .from("daily_tasks")
      .insert(data);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Task Created!",
      description: `"${data.title}" is now active`,
    });

    await fetchDailyTasks();
    return true;
  };

  // Create a seasonal event
  const createEvent = async (data: {
    name: string;
    description: string;
    theme_color: string;
    start_date: string;
    end_date: string;
  }) => {
    if (!isAdmin) return false;

    const { error } = await supabase
      .from("seasonal_events")
      .insert(data);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Event Created!",
      description: `"${data.name}" is now scheduled`,
    });

    await fetchEvents();
    return true;
  };

  return {
    isAdmin,
    loading,
    users,
    challenges,
    dailyTasks,
    events,
    fetchUsers,
    fetchChallenges,
    fetchDailyTasks,
    fetchEvents,
    addXP,
    banUser,
    unbanUser,
    toggleVerified,
    addAdmin,
    createChallenge,
    toggleChallengeActive,
    createDailyTask,
    createEvent,
  };
}
