import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  id: string;
  profile_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string;
  is_verified: boolean;
  status: "pending" | "accepted" | "blocked";
  is_sender: boolean;
}

export function useFriends() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch friends and pending requests
  const fetchFriends = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);

    // Get all friendships where user is involved
    const { data: friendships, error } = await supabase
      .from("friends")
      .select(`
        id,
        user_id,
        friend_id,
        status,
        user_profile:profiles!friends_user_id_fkey(id, username, display_name, avatar_url, is_verified),
        friend_profile:profiles!friends_friend_id_fkey(id, username, display_name, avatar_url, is_verified)
      `)
      .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);

    if (error) {
      console.error("Error fetching friends:", error);
      setLoading(false);
      return;
    }

    // Get online status for all friends
    const friendIds = friendships?.flatMap((f) =>
      f.user_id === profile.id ? [f.friend_id] : [f.user_id]
    ) || [];

    const { data: onlineData } = await supabase
      .from("online_status")
      .select("*")
      .in("profile_id", friendIds);

    const onlineMap = new Map(
      onlineData?.map((o) => [o.profile_id, o]) || []
    );

    const processedFriends: Friend[] = [];
    const processedPending: Friend[] = [];

    friendships?.forEach((f) => {
      const isSender = f.user_id === profile.id;
      const otherProfile = isSender ? f.friend_profile : f.user_profile;
      const otherId = isSender ? f.friend_id : f.user_id;
      const online = onlineMap.get(otherId);

      const friendData: Friend = {
        id: f.id,
        profile_id: otherId,
        username: otherProfile?.username || "Unknown",
        display_name: otherProfile?.display_name || null,
        avatar_url: otherProfile?.avatar_url || null,
        is_online: online?.is_online || false,
        last_seen: online?.last_seen || new Date().toISOString(),
        is_verified: otherProfile?.is_verified || false,
        status: f.status as "pending" | "accepted" | "blocked",
        is_sender: isSender,
      };

      if (f.status === "accepted") {
        processedFriends.push(friendData);
      } else if (f.status === "pending") {
        processedPending.push(friendData);
      }
    });

    setFriends(processedFriends);
    setPendingRequests(processedPending);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("friends-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friends",
        },
        () => {
          fetchFriends();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "online_status",
        },
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.id, fetchFriends]);

  // Send friend request
  const sendFriendRequest = async (friendUsername: string) => {
    if (!profile?.id) return false;

    // Find the user by username
    const { data: friendProfile, error: findError } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", friendUsername)
      .single();

    if (findError || !friendProfile) {
      toast({
        title: "User not found",
        description: `@${friendUsername} doesn't exist`,
        variant: "destructive",
      });
      return false;
    }

    if (friendProfile.id === profile.id) {
      toast({
        title: "Invalid",
        description: "You can't add yourself as a friend",
        variant: "destructive",
      });
      return false;
    }

    // Check if already friends or pending
    const { data: existing } = await supabase
      .from("friends")
      .select("id, status")
      .or(`and(user_id.eq.${profile.id},friend_id.eq.${friendProfile.id}),and(user_id.eq.${friendProfile.id},friend_id.eq.${profile.id})`)
      .maybeSingle();

    if (existing) {
      toast({
        title: existing.status === "accepted" ? "Already friends" : "Request pending",
        description:
          existing.status === "accepted"
            ? `You're already friends with @${friendUsername}`
            : `Friend request already sent to @${friendUsername}`,
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase.from("friends").insert({
      user_id: profile.id,
      friend_id: friendProfile.id,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Request Sent!",
      description: `Friend request sent to @${friendUsername}`,
    });

    await fetchFriends();
    return true;
  };

  // Accept friend request
  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("id", friendshipId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Friend Added!",
      description: "You're now friends",
    });

    await fetchFriends();
    return true;
  };

  // Decline/remove friend
  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("id", friendshipId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
      return false;
    }

    await fetchFriends();
    return true;
  };

  // Update online status
  const updateOnlineStatus = useCallback(
    async (isOnline: boolean) => {
      if (!profile?.id) return;

      await supabase.from("online_status").upsert({
        profile_id: profile.id,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      });
    },
    [profile?.id]
  );

  // Set online when component mounts, offline on unmount
  useEffect(() => {
    if (!profile?.id) return;

    updateOnlineStatus(true);

    const handleVisibilityChange = () => {
      updateOnlineStatus(!document.hidden);
    };

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/online_status?profile_id=eq.${profile.id}`;
      navigator.sendBeacon(
        url,
        JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updateOnlineStatus(false);
    };
  }, [profile?.id, updateOnlineStatus]);

  return {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptRequest,
    removeFriend,
    fetchFriends,
  };
}
