import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  Plus,
  Ban,
  CheckCircle,
  XCircle,
  Loader2,
  Star,
  BadgeCheck,
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AdminPanel() {
  const { isAdmin, loading, users, addXP, banUser, unbanUser, toggleVerified } =
    useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [xpAmount, setXpAmount] = useState("");
  const [banReason, setBanReason] = useState("");
  const [showXPDialog, setShowXPDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-uno-yellow" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <GlassCard className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold font-nunito mb-2">Access Denied</h2>
        <p className="text-muted-foreground font-nunito">
          You don't have permission to access this panel.
        </p>
      </GlassCard>
    );
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddXP = async () => {
    if (!selectedUser || !xpAmount) return;
    setActionLoading(true);
    await addXP(selectedUser, parseInt(xpAmount));
    setActionLoading(false);
    setShowXPDialog(false);
    setXpAmount("");
    setSelectedUser(null);
  };

  const handleBan = async () => {
    if (!selectedUser || !banReason) return;
    setActionLoading(true);
    await banUser(selectedUser, banReason);
    setActionLoading(false);
    setShowBanDialog(false);
    setBanReason("");
    setSelectedUser(null);
  };

  const handleUnban = async (profileId: string) => {
    setActionLoading(true);
    await unbanUser(profileId);
    setActionLoading(false);
  };

  const handleToggleVerify = async (profileId: string) => {
    setActionLoading(true);
    await toggleVerified(profileId);
    setActionLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-uno-yellow" />
        <h1 className="text-3xl font-bold font-nunito">Admin Panel</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="text-center py-4" hover={false}>
          <p className="text-2xl font-bold font-nunito">{users.length}</p>
          <p className="text-muted-foreground text-sm font-nunito">Total Users</p>
        </GlassCard>
        <GlassCard className="text-center py-4" hover={false}>
          <p className="text-2xl font-bold font-nunito text-uno-green">
            {users.filter((u) => u.is_verified).length}
          </p>
          <p className="text-muted-foreground text-sm font-nunito">Verified</p>
        </GlassCard>
        <GlassCard className="text-center py-4" hover={false}>
          <p className="text-2xl font-bold font-nunito text-uno-red">
            {users.filter((u) => u.is_banned).length}
          </p>
          <p className="text-muted-foreground text-sm font-nunito">Banned</p>
        </GlassCard>
        <GlassCard className="text-center py-4" hover={false}>
          <p className="text-2xl font-bold font-nunito text-uno-yellow">
            {users.reduce((sum, u) => sum + u.xp, 0).toLocaleString()}
          </p>
          <p className="text-muted-foreground text-sm font-nunito">Total XP</p>
        </GlassCard>
      </div>

      {/* Users List */}
      <GlassCard hover={false}>
        <div className="divide-y divide-border">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "flex items-center justify-between p-4",
                user.is_banned && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white",
                    user.is_banned
                      ? "bg-muted"
                      : "bg-gradient-to-br from-uno-red via-uno-yellow to-uno-blue"
                  )}
                >
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold font-nunito">
                      @{user.username}
                    </span>
                    {user.is_verified && (
                      <BadgeCheck className="w-4 h-4 text-uno-blue" />
                    )}
                    {user.is_banned && (
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                        BANNED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{user.xp.toLocaleString()} XP</span>
                    <span>{user.wins}W / {user.losses}L</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Add XP */}
                <button
                  onClick={() => {
                    setSelectedUser(user.id);
                    setShowXPDialog(true);
                  }}
                  className="p-2 rounded-lg bg-uno-yellow/20 hover:bg-uno-yellow/30 text-uno-yellow transition-colors"
                  title="Add XP"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Toggle Verify */}
                <button
                  onClick={() => handleToggleVerify(user.id)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    user.is_verified
                      ? "bg-uno-blue/20 hover:bg-uno-blue/30 text-uno-blue"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                  title={user.is_verified ? "Remove Verification" : "Verify User"}
                >
                  <BadgeCheck className="w-4 h-4" />
                </button>

                {/* Ban/Unban */}
                {user.is_banned ? (
                  <button
                    onClick={() => handleUnban(user.id)}
                    className="p-2 rounded-lg bg-uno-green/20 hover:bg-uno-green/30 text-uno-green transition-colors"
                    title="Unban User"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedUser(user.id);
                      setShowBanDialog(true);
                    }}
                    className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors"
                    title="Ban User"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-nunito">
              No users found
            </div>
          )}
        </div>
      </GlassCard>

      {/* Add XP Dialog */}
      <Dialog open={showXPDialog} onOpenChange={setShowXPDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-nunito flex items-center gap-2">
              <Star className="w-5 h-5 text-uno-yellow" />
              Add XP
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              value={xpAmount}
              onChange={(e) => setXpAmount(e.target.value)}
              placeholder="Enter XP amount..."
              className="bg-muted border-border"
            />
          </div>
          <DialogFooter>
            <GameButton
              variant="green"
              size="sm"
              onClick={handleAddXP}
              disabled={actionLoading || !xpAmount}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Add XP"
              )}
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-nunito flex items-center gap-2 text-destructive">
              <Ban className="w-5 h-5" />
              Ban User
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter ban reason..."
              className="bg-muted border-border"
            />
          </div>
          <DialogFooter>
            <GameButton
              variant="red"
              size="sm"
              onClick={handleBan}
              disabled={actionLoading || !banReason}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Ban User"
              )}
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
