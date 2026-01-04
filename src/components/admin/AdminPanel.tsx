import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  Plus,
  Ban,
  CheckCircle,
  BadgeCheck,
  Loader2,
  Star,
  Users,
  Trophy,
  Calendar,
  FileText,
  Upload,
  Sparkles,
  ListTodo,
  Megaphone,
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminPosts } from "@/hooks/useAdminPosts";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function AdminPanel() {
  const {
    isAdmin,
    loading,
    users,
    challenges,
    dailyTasks,
    addXP,
    banUser,
    unbanUser,
    toggleVerified,
    addAdmin,
    createChallenge,
    toggleChallengeActive,
    createDailyTask,
  } = useAdmin();

  const { posts, createPost, deletePost, togglePin } = useAdminPosts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [xpAmount, setXpAmount] = useState("");
  const [banReason, setBanReason] = useState("");
  const [showXPDialog, setShowXPDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Challenge form
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    challenge_type: "daily" as "daily" | "weekly",
    requirement_type: "wins",
    requirement_value: 1,
    xp_reward: 50,
  });

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    task_type: "play_games",
    requirement_value: 1,
    xp_reward: 25,
    valid_date: new Date().toISOString().split('T')[0],
  });

  // Post form
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
  });
  const [postImage, setPostImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleMakeAdmin = async () => {
    if (!selectedUser) return;
    const user = users.find(u => u.id === selectedUser);
    if (!user) return;

    setActionLoading(true);
    await addAdmin(user.user_id);
    setActionLoading(false);
    setShowAdminDialog(false);
    setSelectedUser(null);
  };

  const handleCreateChallenge = async () => {
    setActionLoading(true);
    await createChallenge(challengeForm);
    setActionLoading(false);
    setShowChallengeDialog(false);
    setChallengeForm({
      title: "",
      description: "",
      challenge_type: "daily",
      requirement_type: "wins",
      requirement_value: 1,
      xp_reward: 50,
    });
  };

  const handleCreateTask = async () => {
    setActionLoading(true);
    await createDailyTask(taskForm);
    setActionLoading(false);
    setShowTaskDialog(false);
    setTaskForm({
      title: "",
      description: "",
      task_type: "play_games",
      requirement_value: 1,
      xp_reward: 25,
      valid_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleCreatePost = async () => {
    if (!postForm.title || !postForm.content) return;
    setActionLoading(true);
    await createPost(postForm.title, postForm.content, postImage || undefined);
    setActionLoading(false);
    setShowPostDialog(false);
    setPostForm({ title: "", content: "" });
    setPostImage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-uno-yellow" />
          <h1 className="text-3xl font-bold font-nunito">Admin Panel</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="text-center py-4" hover={false}>
          <Users className="w-6 h-6 mx-auto mb-2 text-uno-blue" />
          <p className="text-2xl font-bold font-nunito">{users.length}</p>
          <p className="text-muted-foreground text-sm font-nunito">Total Users</p>
        </GlassCard>
        <GlassCard className="text-center py-4" hover={false}>
          <Trophy className="w-6 h-6 mx-auto mb-2 text-uno-yellow" />
          <p className="text-2xl font-bold font-nunito">{challenges.length}</p>
          <p className="text-muted-foreground text-sm font-nunito">Challenges</p>
        </GlassCard>
        <GlassCard className="text-center py-4" hover={false}>
          <ListTodo className="w-6 h-6 mx-auto mb-2 text-uno-green" />
          <p className="text-2xl font-bold font-nunito">{dailyTasks.length}</p>
          <p className="text-muted-foreground text-sm font-nunito">Daily Tasks</p>
        </GlassCard>
        <GlassCard className="text-center py-4" hover={false}>
          <Megaphone className="w-6 h-6 mx-auto mb-2 text-uno-red" />
          <p className="text-2xl font-bold font-nunito">{posts.length}</p>
          <p className="text-muted-foreground text-sm font-nunito">Posts</p>
        </GlassCard>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="users" className="font-nunito">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="challenges" className="font-nunito">
            <Trophy className="w-4 h-4 mr-2" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="tasks" className="font-nunito">
            <ListTodo className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="posts" className="font-nunito">
            <FileText className="w-4 h-4 mr-2" />
            Posts
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
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

          {/* Users List */}
          <GlassCard hover={false}>
            <div className="divide-y divide-border">
              {filteredUsers.slice(0, 20).map((user, index) => (
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

                    {/* Make Admin */}
                    <button
                      onClick={() => {
                        setSelectedUser(user.id);
                        setShowAdminDialog(true);
                      }}
                      className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-500 transition-colors"
                      title="Make Admin"
                    >
                      <Shield className="w-4 h-4" />
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
            </div>
          </GlassCard>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <GameButton
            variant="yellow"
            onClick={() => setShowChallengeDialog(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Challenge
          </GameButton>

          <GlassCard hover={false}>
            <div className="divide-y divide-border">
              {challenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center justify-between p-4",
                    !challenge.is_active && "opacity-50"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold font-nunito">{challenge.title}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        challenge.challenge_type === 'daily'
                          ? "bg-uno-blue/20 text-uno-blue"
                          : "bg-uno-red/20 text-uno-red"
                      )}>
                        {challenge.challenge_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    <p className="text-sm text-uno-yellow mt-1">
                      <Star className="w-3 h-3 inline mr-1" />
                      {challenge.xp_reward} XP
                    </p>
                  </div>
                  <button
                    onClick={() => toggleChallengeActive(challenge.id)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-sm font-semibold transition-colors",
                      challenge.is_active
                        ? "bg-uno-green/20 text-uno-green"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {challenge.is_active ? "Active" : "Inactive"}
                  </button>
                </motion.div>
              ))}
              {challenges.length === 0 && (
                <div className="text-center py-8 text-muted-foreground font-nunito">
                  No challenges yet
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <GameButton
            variant="green"
            onClick={() => setShowTaskDialog(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Daily Task
          </GameButton>

          <GlassCard hover={false}>
            <div className="divide-y divide-border">
              {dailyTasks.slice(0, 20).map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold font-nunito">{task.title}</span>
                      <span className="text-xs bg-uno-blue/20 text-uno-blue px-2 py-0.5 rounded">
                        {task.valid_date}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <p className="text-sm text-uno-yellow mt-1">
                      <Star className="w-3 h-3 inline mr-1" />
                      {task.xp_reward} XP
                    </p>
                  </div>
                </motion.div>
              ))}
              {dailyTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground font-nunito">
                  No daily tasks yet
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <GameButton
            variant="red"
            onClick={() => setShowPostDialog(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Post
          </GameButton>

          <GlassCard hover={false}>
            <div className="divide-y divide-border">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold font-nunito">{post.title}</span>
                        {post.is_pinned && (
                          <Sparkles className="w-4 h-4 text-uno-yellow" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="mt-2 rounded-lg max-h-20 object-cover" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => togglePin(post.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          post.is_pinned
                            ? "bg-uno-yellow/20 text-uno-yellow"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {posts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground font-nunito">
                  No posts yet
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

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
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add XP"}
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
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ban User"}
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Admin Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-nunito flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              Make Admin
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground font-nunito">
              Are you sure you want to make this user an admin? This will give them full access to the admin panel.
            </p>
          </div>
          <DialogFooter>
            <GameButton
              variant="blue"
              size="sm"
              onClick={handleMakeAdmin}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Challenge Dialog */}
      <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-nunito flex items-center gap-2">
              <Trophy className="w-5 h-5 text-uno-yellow" />
              New Challenge
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={challengeForm.title}
              onChange={(e) => setChallengeForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Challenge title..."
              className="bg-muted border-border"
            />
            <Textarea
              value={challengeForm.description}
              onChange={(e) => setChallengeForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description..."
              className="bg-muted border-border"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={challengeForm.challenge_type}
                onValueChange={(v) => setChallengeForm(f => ({ ...f, challenge_type: v as 'daily' | 'weekly' }))}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={challengeForm.requirement_type}
                onValueChange={(v) => setChallengeForm(f => ({ ...f, requirement_type: v }))}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Requirement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wins">Wins</SelectItem>
                  <SelectItem value="games_played">Games Played</SelectItem>
                  <SelectItem value="cards_played">Cards Played</SelectItem>
                  <SelectItem value="uno_calls">UNO Calls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Target Value</label>
                <Input
                  type="number"
                  value={challengeForm.requirement_value}
                  onChange={(e) => setChallengeForm(f => ({ ...f, requirement_value: parseInt(e.target.value) || 1 }))}
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">XP Reward</label>
                <Input
                  type="number"
                  value={challengeForm.xp_reward}
                  onChange={(e) => setChallengeForm(f => ({ ...f, xp_reward: parseInt(e.target.value) || 50 }))}
                  className="bg-muted border-border"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <GameButton
              variant="yellow"
              size="sm"
              onClick={handleCreateChallenge}
              disabled={actionLoading || !challengeForm.title}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-nunito flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-uno-green" />
              New Daily Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={taskForm.title}
              onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Task title..."
              className="bg-muted border-border"
            />
            <Textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description..."
              className="bg-muted border-border"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={taskForm.task_type}
                onValueChange={(v) => setTaskForm(f => ({ ...f, task_type: v }))}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="play_games">Play Games</SelectItem>
                  <SelectItem value="win_games">Win Games</SelectItem>
                  <SelectItem value="refer_friend">Refer Friend</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={taskForm.valid_date}
                onChange={(e) => setTaskForm(f => ({ ...f, valid_date: e.target.value }))}
                className="bg-muted border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Target Value</label>
                <Input
                  type="number"
                  value={taskForm.requirement_value}
                  onChange={(e) => setTaskForm(f => ({ ...f, requirement_value: parseInt(e.target.value) || 1 }))}
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">XP Reward</label>
                <Input
                  type="number"
                  value={taskForm.xp_reward}
                  onChange={(e) => setTaskForm(f => ({ ...f, xp_reward: parseInt(e.target.value) || 25 }))}
                  className="bg-muted border-border"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <GameButton
              variant="green"
              size="sm"
              onClick={handleCreateTask}
              disabled={actionLoading || !taskForm.title}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-nunito flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-uno-red" />
              New Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={postForm.title}
              onChange={(e) => setPostForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Post title..."
              className="bg-muted border-border"
            />
            <Textarea
              value={postForm.content}
              onChange={(e) => setPostForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Post content..."
              className="bg-muted border-border min-h-[100px]"
            />
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setPostImage(e.target.files?.[0] || null)}
                accept="image/*"
                className="hidden"
              />
              <GameButton
                variant="blue"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload className="w-4 h-4" />}
              >
                {postImage ? postImage.name : "Upload Image"}
              </GameButton>
              {postImage && (
                <button
                  onClick={() => setPostImage(null)}
                  className="ml-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <GameButton
              variant="red"
              size="sm"
              onClick={handleCreatePost}
              disabled={actionLoading || !postForm.title || !postForm.content}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
