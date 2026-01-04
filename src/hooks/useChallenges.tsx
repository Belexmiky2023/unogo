import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: 'daily' | 'weekly';
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  current_progress: number;
  is_completed: boolean;
  xp_claimed: boolean;
  challenge?: Challenge;
}

export function useChallenges() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!profile) return;

    setLoading(true);

    // Fetch active challenges
    const { data: challengesData } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('challenge_type');

    if (challengesData) {
      setChallenges(challengesData as Challenge[]);
    }

    // Fetch user's challenge progress
    const { data: userProgressData } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('profile_id', profile.id);

    if (userProgressData) {
      setUserChallenges(userProgressData as UserChallenge[]);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Initialize user challenge if not exists
  const initializeChallenge = async (challengeId: string) => {
    if (!profile) return null;

    const existing = userChallenges.find(uc => uc.challenge_id === challengeId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('user_challenges')
      .insert({
        profile_id: profile.id,
        challenge_id: challengeId,
        current_progress: 0,
      })
      .select()
      .single();

    if (!error && data) {
      const newProgress = data as UserChallenge;
      setUserChallenges(prev => [...prev, newProgress]);
      return newProgress;
    }
    return null;
  };

  // Update challenge progress
  const updateProgress = async (challengeId: string, increment: number = 1) => {
    if (!profile) return;

    let userChallenge = userChallenges.find(uc => uc.challenge_id === challengeId);
    if (!userChallenge) {
      userChallenge = await initializeChallenge(challengeId);
    }
    if (!userChallenge || userChallenge.is_completed) return;

    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const newProgress = Math.min(
      userChallenge.current_progress + increment,
      challenge.requirement_value
    );
    const isCompleted = newProgress >= challenge.requirement_value;

    const { error } = await supabase
      .from('user_challenges')
      .update({
        current_progress: newProgress,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', userChallenge.id);

    if (!error) {
      setUserChallenges(prev =>
        prev.map(uc =>
          uc.id === userChallenge!.id
            ? { ...uc, current_progress: newProgress, is_completed: isCompleted }
            : uc
        )
      );

      if (isCompleted) {
        toast({
          title: "🎉 Challenge Complete!",
          description: `You completed "${challenge.title}"! Claim your ${challenge.xp_reward} XP reward.`,
        });
      }
    }
  };

  // Claim XP reward
  const claimReward = async (challengeId: string) => {
    if (!profile) return false;

    const userChallenge = userChallenges.find(uc => uc.challenge_id === challengeId);
    if (!userChallenge || !userChallenge.is_completed || userChallenge.xp_claimed) return false;

    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return false;

    // Update XP
    const { error: xpError } = await supabase
      .from('profiles')
      .update({ xp: profile.xp + challenge.xp_reward })
      .eq('id', profile.id);

    if (xpError) return false;

    // Mark as claimed
    const { error } = await supabase
      .from('user_challenges')
      .update({ xp_claimed: true })
      .eq('id', userChallenge.id);

    if (!error) {
      setUserChallenges(prev =>
        prev.map(uc =>
          uc.id === userChallenge.id ? { ...uc, xp_claimed: true } : uc
        )
      );

      toast({
        title: "XP Claimed! ⭐",
        description: `You earned ${challenge.xp_reward} XP!`,
      });
      return true;
    }
    return false;
  };

  // Get challenge with progress
  const getChallengeWithProgress = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    const progress = userChallenges.find(uc => uc.challenge_id === challengeId);
    return { challenge, progress };
  };

  const dailyChallenges = challenges.filter(c => c.challenge_type === 'daily');
  const weeklyChallenges = challenges.filter(c => c.challenge_type === 'weekly');

  return {
    challenges,
    userChallenges,
    dailyChallenges,
    weeklyChallenges,
    loading,
    fetchChallenges,
    initializeChallenge,
    updateProgress,
    claimReward,
    getChallengeWithProgress,
  };
}
