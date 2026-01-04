import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Trophy, Gamepad2, BadgeCheck, Loader2, Shield, Gift, ListTodo } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { FriendsList } from "@/components/friends/FriendsList";
import { LevelProgress } from "@/components/profile/LevelProgress";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { ReferralPanel } from "@/components/profile/ReferralPanel";
import { ChallengesPanel } from "@/components/challenges/ChallengesPanel";
import { DailyTasksPanel } from "@/components/challenges/DailyTasksPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import unogoLogo from "@/assets/unogo-logo.png";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-uno-yellow" />
      </div>
    );
  }

  const winRate = profile.games_played > 0 
    ? Math.round((profile.wins / profile.games_played) * 100) 
    : 0;

  const extendedProfile = profile as typeof profile & { is_verified?: boolean; is_banned?: boolean };

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-uno-red/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-uno-green/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate("/play")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 font-nunito font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex justify-center mb-6">
            <img src={unogoLogo} alt="UNOGO" className="w-32" />
          </div>
        </motion.div>

        {/* Profile card */}
        <GlassCard className="text-center mb-6" hover={false}>
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-uno-yellow/50"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-uno-red via-uno-yellow to-uno-blue flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          {/* Username */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold font-nunito">
              @{profile.username}
            </h1>
            {extendedProfile.is_verified && (
              <BadgeCheck className="w-6 h-6 text-uno-blue" />
            )}
          </div>
          {profile.display_name && (
            <p className="text-muted-foreground font-nunito">{profile.display_name}</p>
          )}
        </GlassCard>

        {/* Level & Rank Progress */}
        <GlassCard className="mb-6" hover={false}>
          <LevelProgress />
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <GlassCard className="text-center py-4" hover={false}>
            <Trophy className="w-6 h-6 mx-auto mb-2 text-uno-yellow" />
            <p className="text-2xl font-bold font-nunito">{profile.xp.toLocaleString()}</p>
            <p className="text-muted-foreground text-sm font-nunito">XP</p>
          </GlassCard>

          <GlassCard className="text-center py-4" hover={false}>
            <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-uno-green flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <p className="text-2xl font-bold font-nunito text-uno-green">{profile.wins}</p>
            <p className="text-muted-foreground text-sm font-nunito">Wins</p>
          </GlassCard>

          <GlassCard className="text-center py-4" hover={false}>
            <Gamepad2 className="w-6 h-6 mx-auto mb-2 text-uno-blue" />
            <p className="text-2xl font-bold font-nunito">{profile.games_played}</p>
            <p className="text-muted-foreground text-sm font-nunito">Games</p>
          </GlassCard>

          <GlassCard className="text-center py-4" hover={false}>
            <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-uno-red/20 flex items-center justify-center">
              <span className="text-uno-red font-bold text-xs">%</span>
            </div>
            <p className="text-2xl font-bold font-nunito">{winRate}%</p>
            <p className="text-muted-foreground text-sm font-nunito">Win Rate</p>
          </GlassCard>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="challenges" className="mb-6">
          <TabsList className="grid grid-cols-4 w-full mb-4">
            <TabsTrigger value="challenges" className="font-nunito text-xs sm:text-sm">
              <Trophy className="w-4 h-4 mr-1" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="tasks" className="font-nunito text-xs sm:text-sm">
              <ListTodo className="w-4 h-4 mr-1" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="referral" className="font-nunito text-xs sm:text-sm">
              <Gift className="w-4 h-4 mr-1" />
              Referral
            </TabsTrigger>
            <TabsTrigger value="themes" className="font-nunito text-xs sm:text-sm">
              Themes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges">
            <GlassCard hover={false}>
              <ChallengesPanel />
            </GlassCard>
          </TabsContent>

          <TabsContent value="tasks">
            <GlassCard hover={false}>
              <DailyTasksPanel />
            </GlassCard>
          </TabsContent>

          <TabsContent value="referral">
            <ReferralPanel />
          </TabsContent>

          <TabsContent value="themes">
            <GlassCard hover={false}>
              <ThemeSelector />
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Friends List */}
        <GlassCard className="mb-6" hover={false}>
          <FriendsList />
        </GlassCard>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <GameButton
            variant="rainbow"
            onClick={() => navigate("/play")}
            icon={<Gamepad2 className="w-5 h-5" />}
          >
            Play Now
          </GameButton>
          <GameButton
            variant="blue"
            onClick={() => navigate("/leaderboard")}
            icon={<Trophy className="w-5 h-5" />}
          >
            Leaderboard
          </GameButton>
          {isAdmin && (
            <GameButton
              variant="yellow"
              onClick={() => navigate("/admin")}
              icon={<Shield className="w-5 h-5" />}
            >
              Admin
            </GameButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
