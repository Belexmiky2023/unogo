import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  xp_rewarded: number;
  created_at: string;
  referred_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

const XP_PER_REFERRAL = 100;

export function useReferral() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [totalReferralXP, setTotalReferralXP] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    if (!profile) return;

    setLoading(true);

    // Get referral code from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', profile.id)
      .single();

    if (profileData) {
      setReferralCode(profileData.referral_code);
    }

    // Get all referrals made by this user
    const { data: referralsData } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_profile:profiles!referrals_referred_id_fkey(username, avatar_url)
      `)
      .eq('referrer_id', profile.id)
      .order('created_at', { ascending: false });

    if (referralsData) {
      // Transform the data to match our interface
      const transformedReferrals = referralsData.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        referrer_id: r.referrer_id as string,
        referred_id: r.referred_id as string,
        xp_rewarded: r.xp_rewarded as number,
        created_at: r.created_at as string,
        referred_profile: r.referred_profile as { username: string; avatar_url: string | null } | undefined,
      }));
      setReferrals(transformedReferrals);
      setTotalReferralXP(transformedReferrals.reduce((sum: number, r: Referral) => sum + r.xp_rewarded, 0));
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Process a referral code (called when a new user signs up with a code)
  const processReferralCode = async (code: string) => {
    if (!profile) return { success: false, error: 'Not logged in' };

    // Check if user was already referred
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', profile.id)
      .maybeSingle();

    if (existingReferral) {
      return { success: false, error: 'You have already used a referral code' };
    }

    // Find the referrer by code
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id, xp')
      .eq('referral_code', code.toUpperCase())
      .maybeSingle();

    if (!referrer) {
      return { success: false, error: 'Invalid referral code' };
    }

    if (referrer.id === profile.id) {
      return { success: false, error: 'You cannot refer yourself' };
    }

    // Create the referral
    const { error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: profile.id,
        xp_rewarded: XP_PER_REFERRAL,
      });

    if (referralError) {
      return { success: false, error: 'Failed to process referral' };
    }

    // Award XP to referrer
    await supabase
      .from('profiles')
      .update({ xp: referrer.xp + XP_PER_REFERRAL })
      .eq('id', referrer.id);

    toast({
      title: "Referral Applied! 🎉",
      description: `Thanks for joining through a friend's referral!`,
    });

    return { success: true };
  };

  // Generate referral link
  const getReferralLink = () => {
    if (!referralCode) return null;
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth?ref=${referralCode}`;
  };

  // Copy referral link to clipboard
  const copyReferralLink = async () => {
    const link = getReferralLink();
    if (!link) return false;

    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Copied! 📋",
        description: "Referral link copied to clipboard",
      });
      return true;
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    referrals,
    referralCode,
    referralLink: getReferralLink(),
    totalReferralXP,
    referralCount: referrals.length,
    loading,
    fetchReferrals,
    processReferralCode,
    copyReferralLink,
    XP_PER_REFERRAL,
  };
}
