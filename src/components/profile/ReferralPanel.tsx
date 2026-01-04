import { motion } from "framer-motion";
import { Gift, Users, Copy, Share2, Star } from "lucide-react";
import { useReferral } from "@/hooks/useReferral";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { formatDistanceToNow } from "date-fns";

export function ReferralPanel() {
  const {
    referrals,
    referralCode,
    referralLink,
    totalReferralXP,
    referralCount,
    loading,
    copyReferralLink,
    XP_PER_REFERRAL,
  } = useReferral();

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading referral info...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Link Card */}
      <GlassCard className="text-center" hover={false}>
        <Gift className="w-12 h-12 mx-auto mb-4 text-uno-yellow" />
        <h3 className="text-xl font-bold font-nunito mb-2">Invite Friends & Earn XP!</h3>
        <p className="text-muted-foreground mb-4 font-nunito">
          Get <span className="text-uno-yellow font-semibold">{XP_PER_REFERRAL} XP</span> for each friend who joins using your link
        </p>

        {/* Referral Code Display */}
        <div className="bg-muted/50 rounded-xl p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-1 font-nunito">Your Referral Code</p>
          <p className="text-2xl font-bold font-nunito tracking-wider text-uno-blue">
            {referralCode || '---'}
          </p>
        </div>

        {/* Referral Link */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            readOnly
            value={referralLink || 'Loading...'}
            className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm font-mono truncate"
          />
          <GameButton
            variant="blue"
            size="sm"
            onClick={copyReferralLink}
            icon={<Copy className="w-4 h-4" />}
          >
            Copy
          </GameButton>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-2 justify-center">
          <GameButton
            variant="green"
            size="sm"
            onClick={copyReferralLink}
            icon={<Share2 className="w-4 h-4" />}
          >
            Share Link
          </GameButton>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="text-center py-4" hover={false}>
          <Users className="w-6 h-6 mx-auto mb-2 text-uno-blue" />
          <p className="text-2xl font-bold font-nunito">{referralCount}</p>
          <p className="text-sm text-muted-foreground font-nunito">Referrals</p>
        </GlassCard>
        <GlassCard className="text-center py-4" hover={false}>
          <Star className="w-6 h-6 mx-auto mb-2 text-uno-yellow" />
          <p className="text-2xl font-bold font-nunito">{totalReferralXP}</p>
          <p className="text-sm text-muted-foreground font-nunito">XP Earned</p>
        </GlassCard>
      </div>

      {/* Referral History */}
      {referrals.length > 0 && (
        <div>
          <h4 className="text-lg font-bold font-nunito mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-uno-green" />
            Recent Referrals
          </h4>
          <div className="space-y-2">
            {referrals.slice(0, 5).map((referral, index) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-uno-red via-uno-yellow to-uno-blue flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {referral.referred_profile?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold font-nunito">
                      @{referral.referred_profile?.username || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(referral.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <span className="text-uno-yellow font-semibold text-sm">
                  +{referral.xp_rewarded} XP
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
