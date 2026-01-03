import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Gamepad2, Users, Zap, Shield, Globe, Heart } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GameButton } from "@/components/ui/GameButton";
import unogoLogo from "@/assets/unogo-logo.png";

const features = [
  {
    icon: Users,
    title: "Real-time Multiplayer",
    description: "Play with friends or match with players worldwide instantly",
    color: "text-uno-blue",
    bg: "bg-uno-blue/20",
  },
  {
    icon: Gamepad2,
    title: "Smart AI",
    description: "Practice with intelligent robots that challenge you",
    color: "text-uno-green",
    bg: "bg-uno-green/20",
  },
  {
    icon: Zap,
    title: "Fast & Responsive",
    description: "Smooth gameplay on any device, anywhere",
    color: "text-uno-yellow",
    bg: "bg-uno-yellow/20",
  },
  {
    icon: Shield,
    title: "Fair Play",
    description: "Secure matchmaking and anti-cheat systems",
    color: "text-uno-red",
    bg: "bg-uno-red/20",
  },
];

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-uno-red/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-uno-green/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
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
        </motion.div>

        {/* Logo & Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={unogoLogo}
            alt="UNOGO"
            className="w-40 sm:w-52 mx-auto mb-6"
          />
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 font-nunito">
            About UNOGO
          </h1>
        </motion.div>

        {/* Main content */}
        <GlassCard className="mb-8" delay={0.2}>
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-uno-blue" />
            <h2 className="text-2xl font-bold font-nunito">Our Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed font-nunito">
            UNOGO is a worldwide online card game platform designed to bring players together 
            anytime, anywhere. Our mission is simple: make classic card gameplay fast, fun, 
            and accessible for everyone.
          </p>
        </GlassCard>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {features.map((feature, index) => (
            <GlassCard key={feature.title} delay={0.3 + index * 0.1}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${feature.bg}`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-bold mb-1 font-nunito">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm font-nunito">
                    {feature.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Developer section */}
        <GlassCard delay={0.7} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-uno-red" />
            <h2 className="text-2xl font-bold font-nunito">Developer</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6 font-nunito">
            This project is independently developed and maintained with a strong focus on 
            performance, user experience, and quality gameplay. We're committed to building 
            the best UNO experience for our global community.
          </p>
          
          <a
            href="https://t.me/oryn179"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GameButton variant="blue" icon={<Send className="w-5 h-5" />}>
              Inbox Developer
            </GameButton>
          </a>
        </GlassCard>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <GameButton
            variant="rainbow"
            size="xl"
            onClick={() => navigate("/play")}
            icon={<Gamepad2 className="w-6 h-6" />}
          >
            Start Playing Now
          </GameButton>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
