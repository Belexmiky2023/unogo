import { motion } from 'framer-motion';
import { Lock, Check, Sparkles } from 'lucide-react';
import { useLevelSystem } from '@/hooks/useLevelSystem';
import { CardTheme } from '@/lib/levelSystem';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { GlassCard } from '@/components/ui/GlassCard';

export function ThemeSelector() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { themes, selectedTheme, selectTheme, getUserLevelInfo } = useLevelSystem();
  const levelInfo = getUserLevelInfo();

  const handleSelectTheme = async (theme: CardTheme) => {
    if (!levelInfo) return;

    if (levelInfo.xp < theme.required_xp) {
      toast({
        title: "Theme Locked 🔒",
        description: `You need ${theme.required_xp.toLocaleString()} XP to unlock this theme`,
        variant: "destructive",
      });
      return;
    }

    const success = await selectTheme(theme.id);
    if (success) {
      toast({
        title: "Theme Selected! ✨",
        description: `${theme.name} theme is now active`,
      });
    }
  };

  if (!levelInfo) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold font-nunito flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-uno-yellow" />
        Card Themes
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {themes.map((theme) => {
          const isUnlocked = levelInfo.xp >= theme.required_xp;
          const isSelected = selectedTheme?.id === theme.id;

          return (
            <motion.button
              key={theme.id}
              whileHover={isUnlocked ? { scale: 1.05 } : undefined}
              whileTap={isUnlocked ? { scale: 0.95 } : undefined}
              onClick={() => handleSelectTheme(theme)}
              className={`relative p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-uno-yellow bg-uno-yellow/10'
                  : isUnlocked
                  ? 'border-border bg-card hover:border-uno-blue'
                  : 'border-border/50 bg-card/50 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Theme Preview */}
              <div className={`w-full aspect-[3/4] rounded-lg mb-2 ${getThemePreviewClass(theme)}`} />

              {/* Name */}
              <p className="font-bold font-nunito text-sm">{theme.name}</p>
              <p className="text-xs text-muted-foreground font-nunito">
                {theme.required_xp.toLocaleString()} XP
              </p>

              {/* Status Icon */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-uno-green rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              {!isUnlocked && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-muted rounded-full flex items-center justify-center">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function getThemePreviewClass(theme: CardTheme): string {
  const style = theme.theme_data?.style || 'classic';
  
  const styleMap: Record<string, string> = {
    classic: 'bg-gradient-to-br from-uno-red to-uno-red/80',
    neon: 'bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]',
    gold: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600',
    galaxy: 'bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700',
    fire: 'bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400',
    ice: 'bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-500',
    rainbow: 'bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
    diamond: 'bg-gradient-to-br from-white via-gray-200 to-gray-400',
  };

  return styleMap[style] || styleMap.classic;
}
