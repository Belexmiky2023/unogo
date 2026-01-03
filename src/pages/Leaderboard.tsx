import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Star, User, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { Rank, getRank, calculateLevel, getBadgeColorClass } from "@/lib/levelSystem";
import unogoLogo from "@/assets/unogo-logo.png";

interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  wins: number;
  games_played: number;
  is_verified: boolean;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"xp" | "wins" | "games_played">("xp");

  useEffect(() => {
    const fetchRanks = async () => {
      const { data } = await supabase.from('ranks').select('*').order('min_xp');
      if (data) setRanks(data as Rank[]);
    };
    fetchRanks();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, xp, wins, games_played, is_verified")
        .order(sortBy, { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching leaderboard:", error);
      } else {
        setPlayers(data || []);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [sortBy]);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{position}</span>;
    }
  };

  const getPositionBg = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-transparent border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-transparent border-amber-600/30";
      default:
        return "bg-transparent border-border/50";
    }
  };

  const getPlayerRank = (xp: number) => {
    if (ranks.length === 0) return null;
    return getRank(xp, ranks);
  };

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-uno-yellow/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-uno-blue/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
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
            <img src={unogoLogo} alt="UNOGO" className="w-40" />
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 font-nunito flex items-center justify-center gap-3">
            <Star className="w-8 h-8 text-uno-yellow" />
            Global Leaderboard
          </h1>
          <p className="text-muted-foreground text-center mb-8 font-nunito">
            Top players from around the world
          </p>
        </motion.div>

        {/* Sort options */}
        <div className="flex justify-center gap-2 mb-6">
          {[
            { key: "xp" as const, label: "XP" },
            { key: "wins" as const, label: "Wins" },
            { key: "games_played" as const, label: "Games" },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={`px-4 py-2 rounded-lg font-nunito font-semibold transition-all ${
                sortBy === option.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <GlassCard hover={false}>
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-uno-yellow border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-muted-foreground font-nunito">Loading rankings...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground font-nunito">No players yet. Be the first!</p>
              <GameButton
                variant="rainbow"
                className="mt-6"
                onClick={() => navigate("/auth")}
              >
                Sign Up & Play
              </GameButton>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player, index) => {
                const playerRank = getPlayerRank(player.xp);
                const level = calculateLevel(player.xp);
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${getPositionBg(index + 1)}`}
                  >
                    {/* Position */}
                    <div className="flex-shrink-0 w-10">
                      {getPositionIcon(index + 1)}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      {/* Level badge */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-uno-blue rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-background">
                        {level}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-bold font-nunito truncate">
                          @{player.username}
                        </p>
                        {player.is_verified && (
                          <BadgeCheck className="w-4 h-4 text-uno-blue flex-shrink-0" />
                        )}
                      </div>
                      {/* Rank badge */}
                      {playerRank && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColorClass(playerRank.badge_color)} text-white`}>
                            <span>{playerRank.icon}</span>
                            <span>{playerRank.name}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-right">
                      <div>
                        <p className="text-uno-yellow font-bold font-nunito">{player.xp.toLocaleString()}</p>
                        <p className="text-muted-foreground text-xs font-nunito">XP</p>
                      </div>
                      <div>
                        <p className="text-uno-green font-bold font-nunito">{player.wins}</p>
                        <p className="text-muted-foreground text-xs font-nunito">Wins</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-uno-blue font-bold font-nunito">{player.games_played}</p>
                        <p className="text-muted-foreground text-xs font-nunito">Games</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default Leaderboard;
