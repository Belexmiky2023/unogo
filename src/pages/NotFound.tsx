import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Gamepad2 } from "lucide-react";
import { GameButton } from "@/components/ui/GameButton";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-uno-red/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-uno-blue/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 404 Number styled like UNO cards */}
        <div className="flex justify-center gap-4 mb-8">
          {["4", "0", "4"].map((num, index) => (
            <motion.div
              key={index}
              className={`w-20 h-28 sm:w-24 sm:h-32 rounded-2xl flex items-center justify-center shadow-2xl ${
                index === 0
                  ? "bg-uno-red glow-pulse-red"
                  : index === 1
                  ? "bg-uno-yellow glow-pulse-yellow"
                  : "bg-uno-blue glow-pulse-blue"
              }`}
              initial={{ rotate: -10, y: 20, opacity: 0 }}
              animate={{ rotate: index === 1 ? 0 : index === 0 ? -8 : 8, y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <span className={`text-4xl sm:text-5xl font-bold font-nunito ${index === 1 ? "text-gray-900" : "text-white"}`}>
                {num}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.h1
          className="text-2xl sm:text-3xl font-bold mb-4 font-nunito"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Oops! Wrong Card!
        </motion.h1>

        <motion.p
          className="text-muted-foreground mb-8 font-nunito"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          The page you're looking for doesn't exist
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GameButton
            variant="green"
            size="lg"
            icon={<Home className="w-5 h-5" />}
            onClick={() => navigate("/")}
          >
            Go Home
          </GameButton>

          <GameButton
            variant="rainbow"
            size="lg"
            icon={<Gamepad2 className="w-5 h-5" />}
            onClick={() => navigate("/play")}
          >
            Play Game
          </GameButton>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
