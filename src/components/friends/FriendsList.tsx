import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Check,
  X,
  Circle,
  Send,
  Loader2,
  BadgeCheck,
  Gamepad2,
} from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface FriendsListProps {
  onInvite?: (profileId: string) => void;
  showInviteButton?: boolean;
}

export function FriendsList({ onInvite, showInviteButton = false }: FriendsListProps) {
  const {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptRequest,
    removeFriend,
  } = useFriends();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendRequest = async () => {
    if (!username.trim()) return;
    setSending(true);
    await sendFriendRequest(username.trim());
    setSending(false);
    setUsername("");
    setShowAddFriend(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-uno-yellow" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-uno-blue" />
          <h3 className="font-bold font-nunito">Friends</h3>
          <span className="text-muted-foreground text-sm">({friends.length})</span>
        </div>
        <button
          onClick={() => setShowAddFriend(!showAddFriend)}
          className="p-2 rounded-lg bg-uno-green/20 hover:bg-uno-green/30 text-uno-green transition-colors"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Friend Input */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 pb-2">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="bg-muted border-border"
                onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
              />
              <GameButton
                variant="green"
                size="sm"
                onClick={handleSendRequest}
                disabled={sending || !username.trim()}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </GameButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-nunito">
            Pending Requests ({pendingRequests.length})
          </p>
          {pendingRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-uno-red to-uno-yellow flex items-center justify-center text-white font-bold text-sm">
                  {request.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm font-nunito">
                      @{request.username}
                    </span>
                    {request.is_verified && (
                      <BadgeCheck className="w-3 h-3 text-uno-blue" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {request.is_sender ? "Sent request" : "Wants to be friends"}
                  </p>
                </div>
              </div>

              {!request.is_sender && (
                <div className="flex gap-1">
                  <button
                    onClick={() => acceptRequest(request.id)}
                    className="p-1.5 rounded bg-uno-green/20 hover:bg-uno-green/30 text-uno-green"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFriend(request.id)}
                    className="p-1.5 rounded bg-destructive/20 hover:bg-destructive/30 text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-2">
        {friends.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 font-nunito text-sm">
            No friends yet. Add some!
          </p>
        ) : (
          friends.map((friend, index) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={friend.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-uno-blue to-uno-green flex items-center justify-center text-white font-bold">
                      {friend.username[0].toUpperCase()}
                    </div>
                  )}
                  <Circle
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3",
                      friend.is_online
                        ? "text-uno-green fill-uno-green"
                        : "text-muted-foreground fill-muted-foreground"
                    )}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold font-nunito">
                      @{friend.username}
                    </span>
                    {friend.is_verified && (
                      <BadgeCheck className="w-4 h-4 text-uno-blue" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {friend.is_online
                      ? "Online"
                      : `Last seen ${formatDistanceToNow(new Date(friend.last_seen), {
                          addSuffix: true,
                        })}`}
                  </p>
                </div>
              </div>

              {showInviteButton && onInvite && friend.is_online && (
                <button
                  onClick={() => onInvite(friend.profile_id)}
                  className="p-2 rounded-lg bg-uno-green/20 hover:bg-uno-green/30 text-uno-green transition-colors"
                  title="Invite to game"
                >
                  <Gamepad2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
