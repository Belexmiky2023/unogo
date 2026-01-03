// Level and Rank System

export interface Rank {
  id: string;
  name: string;
  min_xp: number;
  badge_color: string;
  icon: string;
}

export interface CardTheme {
  id: string;
  name: string;
  required_xp: number;
  theme_data: {
    style: string;
    effects: string[];
  };
  is_default: boolean;
}

// XP rewards for different game modes
export const XP_REWARDS = {
  AI_WIN: 100,
  AI_LOSS: 25,
  FRIENDS_WIN: 200,
  FRIENDS_LOSS: 50,
  WORLDWIDE_WIN: 500,
  WORLDWIDE_LOSS: 100,
};

// Calculate level from XP (exponential scaling)
export function calculateLevel(xp: number): number {
  // Formula: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Calculate XP needed for next level
export function xpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}

// Calculate progress to next level (0-100)
export function levelProgress(xp: number): number {
  const level = calculateLevel(xp);
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return Math.min(100, Math.max(0, progress));
}

// Get rank from XP using predefined ranks
export function getRank(xp: number, ranks: Rank[]): Rank {
  const sortedRanks = [...ranks].sort((a, b) => b.min_xp - a.min_xp);
  return sortedRanks.find(r => xp >= r.min_xp) || sortedRanks[sortedRanks.length - 1];
}

// Get unlocked themes based on XP
export function getUnlockedThemes(xp: number, themes: CardTheme[]): CardTheme[] {
  return themes.filter(t => xp >= t.required_xp);
}

// Get badge color class based on rank color
export function getBadgeColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-500',
    green: 'bg-uno-green',
    blue: 'bg-uno-blue',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-uno-red',
    yellow: 'bg-uno-yellow text-black',
    rainbow: 'rainbow-border',
  };
  return colorMap[color] || 'bg-gray-500';
}

// Get rank badge glow class
export function getRankGlowClass(color: string): string {
  const glowMap: Record<string, string> = {
    gray: '',
    green: 'glow-green',
    blue: 'glow-blue',
    purple: 'shadow-[0_0_30px_hsl(270_76%_45%/0.6)]',
    orange: 'shadow-[0_0_30px_hsl(30_100%_50%/0.6)]',
    red: 'glow-red',
    yellow: 'glow-yellow',
    rainbow: 'animate-pulse',
  };
  return glowMap[color] || '';
}
