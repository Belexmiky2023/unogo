-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for admin system
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view all roles"
ON public.user_roles
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add is_verified and is_banned to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN ban_reason TEXT DEFAULT NULL;

-- Create friends table
CREATE TABLE public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, friend_id)
);

-- Enable RLS on friends
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- RLS policies for friends
CREATE POLICY "Users can view their friendships"
ON public.friends
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id FROM profiles WHERE id = friends.user_id
        UNION
        SELECT user_id FROM profiles WHERE id = friends.friend_id
    )
);

CREATE POLICY "Users can send friend requests"
ON public.friends
FOR INSERT
WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their friendships"
ON public.friends
FOR UPDATE
USING (
    friend_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their friendships"
ON public.friends
FOR DELETE
USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR friend_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Create online_status table for tracking presence
CREATE TABLE public.online_status (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on online_status
ALTER TABLE public.online_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for online_status
CREATE POLICY "Anyone can view online status"
ON public.online_status
FOR SELECT
USING (true);

CREATE POLICY "Users can update own online status"
ON public.online_status
FOR ALL
USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
)
WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Add trigger for friends updated_at
CREATE TRIGGER update_friends_updated_at
BEFORE UPDATE ON public.friends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for friends and online_status
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_status;