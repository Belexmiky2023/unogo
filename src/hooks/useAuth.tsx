import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  wins: number;
  losses: number;
  games_played: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  emailConfirmationPending: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; emailConfirmationRequired: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile | null;
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state change:", event, currentSession?.user?.email);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Clear email confirmation pending when user confirms
        if (event === 'SIGNED_IN' && currentSession?.user?.email_confirmed_at) {
          setEmailConfirmationPending(false);
        }

        if (currentSession?.user) {
          // Defer profile fetch to avoid deadlocks
          setTimeout(() => {
            fetchProfile(currentSession.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).then(setProfile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return { error, emailConfirmationRequired: false };
      }

      // Check if email confirmation is required
      // If user is created but not confirmed, they need to verify email
      if (data.user && !data.user.email_confirmed_at) {
        setEmailConfirmationPending(true);
        toast({
          title: "Check your email!",
          description: "We've sent you a confirmation link. Please verify your email to continue.",
        });
        return { error: null, emailConfirmationRequired: true };
      }

      toast({
        title: "Account created!",
        description: "Please set up your username to continue.",
      });

      return { error: null, emailConfirmationRequired: false };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      return { error, emailConfirmationRequired: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if the error is due to unconfirmed email
        if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email not verified",
            description: "Please check your email and click the confirmation link.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });

      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setEmailConfirmationPending(false);
    toast({
      title: "Signed out",
      description: "See you next time!",
    });
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        toast({
          title: "Failed to resend",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Email sent!",
        description: "Check your inbox for the confirmation link.",
      });

      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        emailConfirmationPending,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}