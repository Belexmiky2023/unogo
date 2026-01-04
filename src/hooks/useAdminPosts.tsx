import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';

interface AdminPost {
  id: string;
  author_id: string;
  title: string;
  content: string;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    avatar_url: string | null;
  };
}

export function useAdminPosts() {
  const { profile } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from('admin_posts')
      .select(`
        *,
        author:profiles!admin_posts_author_id_fkey(username, avatar_url)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      const transformedPosts = data.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        author_id: p.author_id as string,
        title: p.title as string,
        content: p.content as string,
        image_url: p.image_url as string | null,
        is_pinned: p.is_pinned as boolean,
        created_at: p.created_at as string,
        updated_at: p.updated_at as string,
        author: p.author as { username: string; avatar_url: string | null } | undefined,
      }));
      setPosts(transformedPosts);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  // Create a new post
  const createPost = async (title: string, content: string, imageFile?: File) => {
    if (!isAdmin || !profile) return false;

    let imageUrl = null;

    // Upload image if provided
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('admin-images')
        .upload(fileName, imageFile);

      if (uploadError) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload image",
          variant: "destructive",
        });
        return false;
      }

      const { data: urlData } = supabase.storage
        .from('admin-images')
        .getPublicUrl(uploadData.path);

      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from('admin_posts')
      .insert({
        author_id: profile.id,
        title,
        content,
        image_url: imageUrl,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Post Created! 📝",
      description: "Your post is now live",
    });

    await fetchPosts();
    return true;
  };

  // Update a post
  const updatePost = async (postId: string, updates: Partial<Pick<AdminPost, 'title' | 'content' | 'is_pinned'>>) => {
    if (!isAdmin) return false;

    const { error } = await supabase
      .from('admin_posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Post Updated!",
      description: "Changes saved successfully",
    });

    await fetchPosts();
    return true;
  };

  // Delete a post
  const deletePost = async (postId: string) => {
    if (!isAdmin) return false;

    const { error } = await supabase
      .from('admin_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Post Deleted",
      description: "Post has been removed",
    });

    await fetchPosts();
    return true;
  };

  // Toggle pin status
  const togglePin = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    return updatePost(postId, { is_pinned: !post.is_pinned });
  };

  return {
    posts,
    loading,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    togglePin,
  };
}
