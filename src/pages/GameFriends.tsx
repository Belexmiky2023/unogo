import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, User, Send, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import unogoLogo from "@/assets/unogo-logo.png";

interface SearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
}

const GameFriends = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitedPlayer, setInvitedPlayer] = useState<SearchResult | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, xp")
        .ilike("username", `%${searchQuery}%`)
        .neq("id", profile?.id)
        .limit(10);

      if (!error && data) {
        setSearchResults(data);
      }
      setIsSearching(false);
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, profile?.id]);

  const handleInvite = (player: SearchResult) => {
    setInvitedPlayer(player);
    // In a real implementation, this would send an invite
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-uno-yellow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-uno-yellow/15 rounded-full blur-3xl" />
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
            <img src={unogoLogo} alt="UNOGO" className="w-40" />
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 font-nunito">
            Play With Friends
          </h1>
          <p className="text-muted-foreground text-center mb-8 font-nunito">
            Search for a friend by username and invite them to play
          </p>
        </motion.div>

        {/* Search */}
        <GlassCard className="mb-6" hover={false}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
              @
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="Search username..."
              className="w-full pl-8 pr-12 py-4 bg-muted rounded-xl border-2 border-transparent focus:border-accent focus:outline-none transition-all font-nunito text-lg"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <Search className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-3 bg-muted rounded-xl"
                >
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-uno-red to-uno-blue flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-bold font-nunito">@{player.username}</p>
                    <p className="text-muted-foreground text-sm font-nunito">
                      {player.xp.toLocaleString()} XP
                    </p>
                  </div>

                  <GameButton
                    variant="green"
                    onClick={() => handleInvite(player)}
                    icon={<Send className="w-4 h-4" />}
                  >
                    Invite
                  </GameButton>
                </motion.div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <p className="text-center text-muted-foreground mt-4 font-nunito">
              No players found
            </p>
          )}
        </GlassCard>

        {/* Invited player */}
        {invitedPlayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="text-center" hover={false}>
              <button
                onClick={() => setInvitedPlayer(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="animate-pulse">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-uno-yellow to-uno-green flex items-center justify-center">
                  <Send className="w-8 h-8 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2 font-nunito">
                Invite Sent!
              </h3>
              <p className="text-muted-foreground mb-4 font-nunito">
                Waiting for @{invitedPlayer.username} to accept...
              </p>

              <p className="text-sm text-muted-foreground font-nunito">
                🚧 Multiplayer coming soon!
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Coming soon notice */}
        <motion.div
          className="glass rounded-xl px-6 py-4 text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-muted-foreground text-sm font-nunito">
            🚧 <strong className="text-foreground">Coming Soon:</strong> Real-time multiplayer with friends is under development. 
            For now, try playing with AI!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GameFriends;
