import { motion } from "framer-motion";
import { Megaphone, Pin, Clock, BadgeCheck } from "lucide-react";
import { useAdminPosts } from "@/hooks/useAdminPosts";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function NewsFeed() {
  const { posts, loading } = useAdminPosts();

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading news...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <GlassCard className="text-center py-8" hover={false}>
        <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-bold font-nunito mb-2">No News Yet</h3>
        <p className="text-muted-foreground font-nunito">
          Check back later for updates and announcements!
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-uno-red" />
        <h3 className="text-lg font-bold font-nunito">News & Updates</h3>
      </div>

      <div className="space-y-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              className={cn(
                "overflow-hidden",
                post.is_pinned && "border-uno-yellow/50 border-2"
              )}
              hover={false}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-uno-red via-uno-yellow to-uno-blue flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {post.author?.username?.[0]?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold font-nunito text-sm">
                        @{post.author?.username || 'Admin'}
                      </span>
                      <BadgeCheck className="w-4 h-4 text-uno-blue" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                {post.is_pinned && (
                  <div className="flex items-center gap-1 text-uno-yellow text-xs font-semibold">
                    <Pin className="w-4 h-4" />
                    Pinned
                  </div>
                )}
              </div>

              {/* Content */}
              <h4 className="text-lg font-bold font-nunito mb-2">{post.title}</h4>
              <p className="text-muted-foreground font-nunito whitespace-pre-wrap">{post.content}</p>

              {/* Image */}
              {post.image_url && (
                <div className="mt-4 rounded-lg overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-auto max-h-64 object-cover"
                  />
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
