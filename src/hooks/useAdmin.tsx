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

export function useAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithProfile[]>([]);

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

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

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

  return {
    isAdmin,
    loading,
    users,
    fetchUsers,
    addXP,
    banUser,
    unbanUser,
    toggleVerified,
  };
}
