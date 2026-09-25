export type ColorPaletteKey =
  | 'bento'
  | 'amber'
  | 'emerald'
  | 'royal'
  | 'crimson'
  | 'violet';

export interface ColorPalette {
  name: string;
  badgeLabel: string;
  hex: string;
  lightBg: string;
  progressBarGradient: string;
  btnPrimary: string;
  ringColor: string;
}

export const COLOR_PALETTES: Record<ColorPaletteKey, ColorPalette> = {
  bento: {
    name: 'Executive Bento',
    badgeLabel: 'SLATE',
    hex: '#0f172a',
    lightBg: 'bg-slate-50',
    progressBarGradient: 'from-slate-900 via-slate-800 to-slate-700',
    btnPrimary:
      'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900',
    ringColor: 'focus:ring-slate-900',
  },
  amber: {
    name: 'Abuja Gold',
    badgeLabel: 'GOLD',
    hex: '#f59e0b',
    lightBg: 'bg-amber-50',
    progressBarGradient: 'from-amber-500 to-yellow-400',
    btnPrimary: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold',
    ringColor: 'focus:ring-amber-500',
  },
  emerald: {
    name: 'Harvest Emerald',
    badgeLabel: 'GREEN',
    hex: '#10b981',
    lightBg: 'bg-emerald-50',
    progressBarGradient: 'from-emerald-500 to-teal-400',
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
    ringColor: 'focus:ring-emerald-500',
  },
  royal: {
    name: 'Royal Sapphire',
    badgeLabel: 'BLUE',
    hex: '#2563eb',
    lightBg: 'bg-blue-50',
    progressBarGradient: 'from-blue-600 to-indigo-500',
    btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-bold',
    ringColor: 'focus:ring-blue-600',
  },
  crimson: {
    name: 'Victory Crimson',
    badgeLabel: 'RED',
    hex: '#ef4444',
    lightBg: 'bg-rose-50',
    progressBarGradient: 'from-rose-500 to-red-600',
    btnPrimary: 'bg-rose-600 hover:bg-rose-700 text-white font-bold',
    ringColor: 'focus:ring-rose-600',
  },
  violet: {
    name: 'Majesty Purple',
    badgeLabel: 'PURPLE',
    hex: '#8b5cf6',
    lightBg: 'bg-purple-50',
    progressBarGradient: 'from-purple-600 to-violet-500',
    btnPrimary: 'bg-purple-600 hover:bg-purple-700 text-white font-bold',
    ringColor: 'focus:ring-purple-600',
  },
};
