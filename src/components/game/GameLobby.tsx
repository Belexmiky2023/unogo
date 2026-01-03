import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Crown, Search, Send, Loader2, User, Copy, Check, BadgeCheck } from "lucide-react";
import { MultiplayerGame } from "@/hooks/useMultiplayer";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { FriendsList } from "@/components/friends/FriendsList";

interface SearchResult {
  id: string;
  username: string;
  xp: number;
}

interface GameLobbyProps {
  game: MultiplayerGame;
  onStartGame: () => void;
  onSendInvite: (profileId: string) => void;
  isLoading: boolean;
}

export function GameLobby({ game, onStartGame, onSendInvite, isLoading }: GameLobbyProps) {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const isHost = game.players[0]?.profile_id === profile?.id;
  const canStart = game.players.length >= 2;

  const handleSearch = async (query: string) => {
    setSearchQuery(query.toLowerCase().replace(/[^a-z0-9_]/g, ""));
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    const existingPlayerIds = game.players.map(p => p.profile_id);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, xp")
      .ilike("username", `%${query}%`)
      .not("id", "in", `(${existingPlayerIds.join(",")})`)
      .limit(5);

    if (!error && data) {
      setSearchResults(data);
    }
    setIsSearching(false);
  };

  const handleInvite = (player: SearchResult) => {
    onSendInvite(player.id);
    setInvitedIds(prev => new Set(prev).add(player.id));
    setSearchQuery("");
    setSearchResults([]);
  };

  const copyGameLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/game/friends?join=${game.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Lobby Header */}
      <GlassCard hover={false}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-uno-yellow to-uno-green flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-nunito">Game Lobby</h2>
              <p className="text-muted-foreground text-sm font-nunito">
                {game.players.length} / 4 players
              </p>
            </div>
          </div>
          
          <button
            onClick={copyGameLink}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors font-nunito"
          >
            {copied ? <Check className="w-4 h-4 text-uno-green" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </GlassCard>

      {/* Players List */}
      <GlassCard hover={false}>
        <h3 className="font-bold font-nunito mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Players
        </h3>
        
        <div className="space-y-3">
          {game.players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 bg-muted rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-uno-red to-uno-blue flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-nunito">@{player.username}</span>
                  {index === 0 && (
                    <Crown className="w-4 h-4 text-uno-yellow" />
                  )}
                  {player.profile_id === profile?.id && (
                    <span className="text-xs bg-uno-blue/20 text-uno-blue px-2 py-0.5 rounded-full font-nunito">
                      You
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-nunito">
                  Ready
                </span>
                <div className="w-3 h-3 rounded-full bg-uno-green animate-pulse" />
              </div>
            </motion.div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 4 - game.players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border-2 border-dashed border-muted-foreground/20"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground font-nunito">
                Waiting for player...
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Friends List for Quick Invite */}
      {isHost && game.players.length < 4 && (
        <GlassCard hover={false}>
          <FriendsList 
            onInvite={(profileId) => {
              onSendInvite(profileId);
              setInvitedIds(prev => new Set(prev).add(profileId));
            }}
            showInviteButton={true}
          />
          
          {/* Manual Search */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="font-semibold font-nunito mb-3 text-sm flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search All Players
            </h4>
            
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                @
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search username..."
                className="w-full pl-8 pr-12 py-3 bg-muted rounded-xl border-2 border-transparent focus:border-accent focus:outline-none transition-all font-nunito"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-uno-yellow to-uno-green flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <span className="font-bold font-nunito">@{player.username}</span>
                      <p className="text-xs text-muted-foreground font-nunito">
                        {player.xp.toLocaleString()} XP
                      </p>
                    </div>

                    <GameButton
                      variant="green"
                      size="sm"
                      onClick={() => handleInvite(player)}
                      disabled={invitedIds.has(player.id)}
                      icon={invitedIds.has(player.id) ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    >
                      {invitedIds.has(player.id) ? "Sent" : "Invite"}
                    </GameButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Start Game Button */}
      {isHost && (
        <GameButton
          variant="rainbow"
          size="lg"
          className="w-full"
          onClick={onStartGame}
          disabled={!canStart || isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : canStart ? (
            "Start Game 🎮"
          ) : (
            "Need at least 2 players"
          )}
        </GameButton>
      )}

      {!isHost && (
        <div className="text-center">
          <p className="text-muted-foreground font-nunito">
            Waiting for the host to start the game...
          </p>
          <div className="flex justify-center mt-4">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-uno-yellow animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}