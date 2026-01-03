import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Loader2, Check, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { GameButton } from "@/components/ui/GameButton";
import { GlassCard } from "@/components/ui/GlassCard";
import unogoLogo from "@/assets/unogo-logo.png";

const SetupUsername = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!loading && profile) {
      navigate("/play");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    // Generate initial suggestions
    if (user?.email) {
      generateSuggestions(user.email.split("@")[0]);
    }
  }, [user]);

  const generateSuggestions = async (baseName: string) => {
    try {
      const { data, error } = await supabase.rpc("generate_username_suggestions", {
        base_name: baseName,
      });
      if (!error && data) {
        setSuggestions(data);
      }
    } catch (err) {
      console.error("Error generating suggestions:", err);
    }
  };

  const checkUsername = async (name: string) => {
    if (name.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc("is_username_available", {
        check_username: name,
      });

      if (error) throw error;
      setIsAvailable(data);
      
      if (!data) {
        setError("Username is already taken or reserved");
      }
    } catch (err) {
      console.error("Error checking username:", err);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        checkUsername(username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAvailable || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        username: username.toLowerCase(),
        display_name: username,
      });

      if (error) {
        if (error.code === "23505") {
          setError("Username is already taken");
          setIsAvailable(false);
        } else {
          throw error;
        }
        return;
      }

      await refreshProfile();
      navigate("/play");
    } catch (err) {
      console.error("Error creating profile:", err);
      setError("Failed to create profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setUsername(suggestion);
    setIsAvailable(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-uno-yellow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-uno-green/20 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-uno-yellow/20 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center mb-6">
          <img src={unogoLogo} alt="UNOGO" className="w-40" />
        </div>

        <GlassCard className="w-full" hover={false}>
          <h2 className="text-2xl font-bold text-center mb-2 font-nunito">
            Choose Your Username
          </h2>
          <p className="text-muted-foreground text-center mb-6 font-nunito">
            This will be your identity in UNOGO
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username input */}
            <div>
              <label className="block text-sm font-medium mb-2 font-nunito">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="your_username"
                  maxLength={20}
                  className="w-full pl-8 pr-12 py-3 bg-muted rounded-xl border-2 border-transparent focus:border-accent focus:outline-none transition-all font-nunito"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isChecking ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : isAvailable === true ? (
                    <Check className="w-5 h-5 text-uno-green" />
                  ) : isAvailable === false ? (
                    <X className="w-5 h-5 text-uno-red" />
                  ) : null}
                </div>
              </div>
              {error && (
                <p className="text-destructive text-sm mt-1 font-nunito">{error}</p>
              )}
              <p className="text-muted-foreground text-xs mt-1 font-nunito">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium font-nunito">Suggestions</span>
                  <button
                    type="button"
                    onClick={() => user?.email && generateSuggestions(user.email.split("@")[0])}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className="px-3 py-1 bg-muted hover:bg-accent rounded-full text-sm font-nunito transition-colors"
                    >
                      @{suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <GameButton
              variant="green"
              size="lg"
              className="w-full mt-6"
              disabled={!isAvailable || isSubmitting || username.length < 3}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <User className="w-5 h-5" />
                  Confirm Username
                </>
              )}
            </GameButton>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default SetupUsername;
