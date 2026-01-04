import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

interface EventReward {
  id: string;
  event_id: string;
  reward_type: 'theme' | 'badge' | 'xp_boost';
  reward_data: Record<string, unknown>;
  xp_required: number;
}

interface UserEventProgress {
  id: string;
  profile_id: string;
  event_id: string;
  event_xp: number;
  rewards_claimed: string[];
}

export function useSeasonalEvents() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<SeasonalEvent | null>(null);
  const [eventRewards, setEventRewards] = useState<EventReward[]>([]);
  const [userProgress, setUserProgress] = useState<UserEventProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);

    const now = new Date().toISOString();

    // Fetch active seasonal events
    const { data: eventsData } = await supabase
      .from('seasonal_events')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('start_date', { ascending: false });

    if (eventsData && eventsData.length > 0) {
      setEvents(eventsData as SeasonalEvent[]);
      setActiveEvent(eventsData[0] as SeasonalEvent);

      // Fetch rewards for active event
      const { data: rewardsData } = await supabase
        .from('event_rewards')
        .select('*')
        .eq('event_id', eventsData[0].id)
        .order('xp_required');

      if (rewardsData) {
        const parsedRewards = rewardsData.map(r => ({
          ...r,
          reward_data: r.reward_data as Record<string, unknown>,
        })) as EventReward[];
        setEventRewards(parsedRewards);
      }

      // Fetch user's progress if logged in
      if (profile) {
        const { data: progressData } = await supabase
          .from('user_event_progress')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('event_id', eventsData[0].id)
          .maybeSingle();

        if (progressData) {
          setUserProgress({
            ...progressData,
            rewards_claimed: Array.isArray(progressData.rewards_claimed) 
              ? progressData.rewards_claimed as string[]
              : [],
          });
        }
      }
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Initialize user progress for event
  const initializeProgress = async (eventId: string) => {
    if (!profile) return null;

    const { data, error } = await supabase
      .from('user_event_progress')
      .insert({
        profile_id: profile.id,
        event_id: eventId,
        event_xp: 0,
        rewards_claimed: [],
      })
      .select()
      .single();

    if (!error && data) {
      const progress = {
        ...data,
        rewards_claimed: [],
      } as UserEventProgress;
      setUserProgress(progress);
      return progress;
    }
    return null;
  };

  // Add XP to event progress
  const addEventXP = async (xp: number) => {
    if (!profile || !activeEvent) return;

    let progress = userProgress;
    if (!progress) {
      progress = await initializeProgress(activeEvent.id);
    }
    if (!progress) return;

    const newXP = progress.event_xp + xp;

    const { error } = await supabase
      .from('user_event_progress')
      .update({ event_xp: newXP })
      .eq('id', progress.id);

    if (!error) {
      setUserProgress(prev => prev ? { ...prev, event_xp: newXP } : null);

      // Check for new unlocked rewards
      const newRewards = eventRewards.filter(
        r => r.xp_required <= newXP && !progress!.rewards_claimed.includes(r.id)
      );

      if (newRewards.length > 0) {
        toast({
          title: "🎁 New Reward Unlocked!",
          description: `You unlocked ${newRewards.length} new event reward(s)!`,
        });
      }
    }
  };

  // Claim a reward
  const claimReward = async (rewardId: string) => {
    if (!profile || !userProgress) return false;

    const reward = eventRewards.find(r => r.id === rewardId);
    if (!reward || userProgress.rewards_claimed.includes(rewardId)) return false;
    if (userProgress.event_xp < reward.xp_required) return false;

    const newClaimedRewards = [...userProgress.rewards_claimed, rewardId];

    const { error } = await supabase
      .from('user_event_progress')
      .update({ rewards_claimed: newClaimedRewards })
      .eq('id', userProgress.id);

    if (!error) {
      setUserProgress(prev => 
        prev ? { ...prev, rewards_claimed: newClaimedRewards } : null
      );

      toast({
        title: "Reward Claimed! 🎉",
        description: `You claimed the ${reward.reward_type} reward!`,
      });
      return true;
    }
    return false;
  };

  // Get time remaining for event
  const getTimeRemaining = () => {
    if (!activeEvent) return null;

    const end = new Date(activeEvent.end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    };
  };

  return {
    events,
    activeEvent,
    eventRewards,
    userProgress,
    loading,
    fetchEvents,
    addEventXP,
    claimReward,
    getTimeRemaining,
  };
}
