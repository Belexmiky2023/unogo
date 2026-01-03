import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Gamepad2, Info } from "lucide-react";
import { GameButton } from "@/components/ui/GameButton";
import { FloatingCards } from "@/components/FloatingCards";
import unogoLogo from "@/assets/unogo-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-uno-red/20 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-uno-blue/20 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-uno-yellow/15 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Floating cards background */}
      <FloatingCards />

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo */}
        <motion.img
          src={unogoLogo}
          alt="UNOGO"
          className="w-64 sm:w-80 md:w-96 mb-4 drop-shadow-2xl float"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "backOut" }}
        />

        {/* Tagline */}
        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 font-nunito font-semibold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Play UNO Anywhere. Anytime.
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <GameButton
            variant="rainbow"
            size="xl"
            icon={<Gamepad2 className="w-7 h-7" />}
            onClick={() => navigate("/play")}
          >
            Play Uno
          </GameButton>

          <GameButton
            variant="blue"
            size="xl"
            icon={<Info className="w-7 h-7" />}
            onClick={() => navigate("/about")}
          >
            About UNO-Go
          </GameButton>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="absolute bottom-6 text-muted-foreground text-sm font-nunito"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        © 2026 UNOGO - Play with the world
      </motion.footer>
    </div>
  );
};

export default Index;
