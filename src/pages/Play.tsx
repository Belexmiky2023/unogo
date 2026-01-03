import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bot, Users, Globe, ArrowLeft, Trophy, LogIn, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GameButton } from "@/components/ui/GameButton";
import { GlassCard } from "@/components/ui/GlassCard";
import unogoLogo from "@/assets/unogo-logo.png";

const gameModes = [
  {
    id: "ai",
    title: "Play With AI",
    description: "Practice against smart robots",
    icon: Bot,
    variant: "green" as const,
    xp: "+100 XP per win",
    requiresAuth: false,
    route: "/game/ai",
  },
  {
    id: "friends",
    title: "Play With Friends",
    description: "Invite friends by username",
    icon: Users,
    variant: "yellow" as const,
    xp: "+200 XP per win",
    requiresAuth: true,
    route: "/game/friends",
  },
  {
    id: "worldwide",
    title: "Play Worldwide",
    description: "Match with players globally",
    icon: Globe,
    variant: "blue" as const,
    xp: "+500 XP per win",
    requiresAuth: true,
    route: "/game/worldwide",
  },
];

const Play = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleModeSelect = (mode: typeof gameModes[0]) => {
    if (mode.requiresAuth && !user) {
      navigate("/auth");
      return;
    }
    navigate(mode.route);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-uno-green/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-uno-blue/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        className="relative z-10 w-full max-w-4xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-nunito font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Home
          </button>

          <div className="flex items-center gap-4">
            {user && profile ? (
              <>
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-nunito font-semibold"
                >
                  <User className="w-5 h-5" />
                  @{profile.username}
                </button>
                <button
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center gap-2 text-uno-yellow hover:text-yellow-300 transition-colors font-nunito font-semibold"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <motion.img
            src={unogoLogo}
            alt="UNOGO"
            className="w-40 sm:w-52"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* User stats (if logged in) */}
        {profile && (
          <motion.div
            className="flex justify-center gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="flex items-center gap-3 py-3 px-5" hover={false}>
              <Trophy className="w-5 h-5 text-uno-yellow" />
              <div>
                <p className="text-xl font-bold font-nunito">{profile.xp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground font-nunito">Total XP</p>
              </div>
            </GlassCard>
            <GlassCard className="flex items-center gap-3 py-3 px-5" hover={false}>
              <div className="text-uno-green font-bold text-xl">{profile.wins}</div>
              <div>
                <p className="text-sm font-nunito">Wins</p>
                <p className="text-xs text-muted-foreground font-nunito">{profile.games_played} games</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          className="text-3xl sm:text-4xl font-bold text-center mb-3 font-nunito"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Choose Your Game Mode
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-center mb-10 font-nunito"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Select how you want to play
        </motion.p>
      </motion.div>

      {/* Game mode cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {gameModes.map((mode, index) => (
          <GlassCard key={mode.id} delay={0.2 + index * 0.1} className="flex flex-col items-center text-center">
            <motion.div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                mode.variant === "green"
                  ? "bg-uno-green/20"
                  : mode.variant === "yellow"
                  ? "bg-uno-yellow/20"
                  : "bg-uno-blue/20"
              }`}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <mode.icon
                className={`w-10 h-10 ${
                  mode.variant === "green"
                    ? "text-uno-green"
                    : mode.variant === "yellow"
                    ? "text-uno-yellow"
                    : "text-uno-blue"
                }`}
              />
            </motion.div>

            <h3 className="text-xl font-bold mb-2 font-nunito">{mode.title}</h3>
            <p className="text-muted-foreground text-sm mb-4 font-nunito">{mode.description}</p>
            
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full mb-4 ${
                mode.variant === "green"
                  ? "bg-uno-green/20 text-uno-green"
                  : mode.variant === "yellow"
                  ? "bg-uno-yellow/20 text-uno-yellow"
                  : "bg-uno-blue/20 text-uno-blue"
              }`}
            >
              {mode.xp}
            </span>

            <GameButton
              variant={mode.variant}
              onClick={() => handleModeSelect(mode)}
              className="w-full"
            >
              {mode.requiresAuth && !user ? "Sign In to Play" : "Play Now"}
            </GameButton>
          </GlassCard>
        ))}
      </div>

      {/* Leaderboard link */}
      <motion.div
        className="relative z-10 mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <GameButton
          variant="rainbow"
          size="lg"
          onClick={() => navigate("/leaderboard")}
          icon={<Trophy className="w-5 h-5" />}
        >
          View Leaderboard
        </GameButton>
      </motion.div>

      {/* Info notice */}
      {!user && (
        <motion.div
          className="relative z-10 mt-6 glass rounded-xl px-6 py-4 max-w-lg text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-muted-foreground text-sm font-nunito">
            🎮 <strong className="text-foreground">Demo Mode:</strong> Play with AI is available without login.
            Sign up to unlock Friends & Worldwide modes!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Play;
