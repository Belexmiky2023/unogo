import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Rank, 
  CardTheme, 
  calculateLevel, 
  levelProgress, 
  getRank, 
  getUnlockedThemes,
  xpForNextLevel
} from '@/lib/levelSystem';

export function useLevelSystem() {
  const { profile } = useAuth();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [themes, setThemes] = useState<CardTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<CardTheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const [ranksRes, themesRes] = await Promise.all([
        supabase.from('ranks').select('*').order('min_xp'),
        supabase.from('card_themes').select('*').order('required_xp'),
      ]);

      if (ranksRes.data) {
        setRanks(ranksRes.data as Rank[]);
      }

      if (themesRes.data) {
        const parsedThemes = themesRes.data.map(t => ({
          ...t,
          theme_data: t.theme_data as CardTheme['theme_data'],
        })) as CardTheme[];
        setThemes(parsedThemes);
        
        // Set default theme
        const defaultTheme = parsedThemes.find(t => t.is_default);
        setSelectedTheme(defaultTheme || null);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Get user's current level info
  const getUserLevelInfo = () => {
    if (!profile) return null;
    
    const xp = profile.xp || 0;
    const level = calculateLevel(xp);
    const progress = levelProgress(xp);
    const nextLevelXp = xpForNextLevel(level);
    const currentRank = ranks.length > 0 ? getRank(xp, ranks) : null;
    const unlockedThemes = getUnlockedThemes(xp, themes);

    return {
      xp,
      level,
      progress,
      nextLevelXp,
      currentRank,
      unlockedThemes,
    };
  };

  // Select a theme
  const selectTheme = async (themeId: string) => {
    if (!profile) return false;

    const theme = themes.find(t => t.id === themeId);
    if (!theme) return false;

    // Check if user has enough XP
    if (profile.xp < theme.required_xp) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ selected_theme: themeId })
      .eq('id', profile.id);

    if (!error) {
      setSelectedTheme(theme);
      return true;
    }
    return false;
  };

  return {
    ranks,
    themes,
    selectedTheme,
    loading,
    getUserLevelInfo,
    selectTheme,
  };
}
