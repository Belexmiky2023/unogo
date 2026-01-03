import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { GameButton } from "@/components/ui/GameButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { FloatingCards } from "@/components/FloatingCards";
import unogoLogo from "@/assets/unogo-logo.png";

const emailSchema = z.string().email("Please enter a valid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const navigate = useNavigate();
  const { user, profile, signUp, signIn, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (profile) {
        navigate("/play");
      } else {
        navigate("/setup-username");
      }
    }
  }, [user, profile, loading, navigate]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
    
    setIsSubmitting(false);
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
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-uno-red/20 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-uno-blue/20 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <FloatingCards />

      {/* Header */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 font-nunito font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="flex justify-center mb-6">
          <img src={unogoLogo} alt="UNOGO" className="w-40" />
        </div>
      </motion.div>

      {/* Auth Card */}
      <GlassCard className="relative z-10 w-full max-w-md" hover={false}>
        {/* Animated rainbow border */}
        <div className="absolute -inset-[2px] rounded-2xl rainbow-border opacity-50" />
        
        <div className="relative bg-card rounded-2xl p-6">
          {/* Tab switcher */}
          <div className="flex mb-6 bg-muted rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-lg font-nunito font-bold transition-all ${
                isLogin
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-lg font-nunito font-bold transition-all ${
                !isLogin
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-center mb-4 font-nunito">
                {isLogin ? "Welcome Back!" : "Join UNOGO"}
              </h2>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2 font-nunito">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-muted rounded-xl border-2 border-transparent focus:border-accent focus:outline-none transition-all font-nunito"
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm mt-1 font-nunito">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2 font-nunito">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-muted rounded-xl border-2 border-transparent focus:border-accent focus:outline-none transition-all font-nunito"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm mt-1 font-nunito">{errors.password}</p>
                )}
              </div>

              <GameButton
                variant="rainbow"
                size="lg"
                className="w-full mt-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  "Login"
                ) : (
                  "Create Account"
                )}
              </GameButton>
            </motion.form>
          </AnimatePresence>

          {/* Demo notice */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-muted-foreground text-sm font-nunito">
              🎮 Want to try first?{" "}
              <button
                onClick={() => navigate("/game/ai")}
                className="text-uno-yellow hover:underline font-bold"
              >
                Play Demo with AI
              </button>
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Auth;
