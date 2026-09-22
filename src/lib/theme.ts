export type ColorPaletteKey = 'bento' | 'amber' | 'blue' | 'emerald' | 'rose' | 'violet' | 'indigo';

export interface ColorPalette {
  id: ColorPaletteKey;
  name: string;
  badgeLabel: string;
  hex: string;
  secondaryHex: string;
  tertiaryHex: string;
  chartStroke: string;
  chartFill: string;
  donutColors: [string, string, string];
  // CSS class sets
  badgeBg: string;
  btnPrimary: string;
  textAccent: string;
  glowBg: string;
  borderAccent: string;
  progressBarGradient: string;
}

export const COLOR_PALETTES: Record<ColorPaletteKey, ColorPalette> = {
  bento: {
    id: 'bento',
    name: 'Fintech Bento & Slate',
    badgeLabel: 'Bento',
    hex: '#3b82f6',
    secondaryHex: '#60a5fa',
    tertiaryHex: '#1d4ed8',
    chartStroke: '#111317',
    chartFill: '#111317',
    donutColors: ['#3b82f6', '#111317', '#94a3b8'],
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/70',
    btnPrimary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold',
    textAccent: 'text-blue-600 dark:text-blue-400',
    glowBg: 'bg-blue-500/10',
    borderAccent: 'border-blue-500/30 hover:border-blue-500',
    progressBarGradient: 'from-blue-600 via-indigo-500 to-sky-400',
  },
  blue: {
    id: 'blue',
    name: 'Royal Sapphire',
    badgeLabel: 'Blue',
    hex: '#2563eb',
    secondaryHex: '#60a5fa',
    tertiaryHex: '#1d4ed8',
    chartStroke: '#2563eb',
    chartFill: '#2563eb',
    donutColors: ['#2563eb', '#60a5fa', '#1d4ed8'],
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80',
    btnPrimary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20',
    textAccent: 'text-blue-600 dark:text-blue-400',
    glowBg: 'bg-blue-500/10',
    borderAccent: 'border-blue-500/40 hover:border-blue-500',
    progressBarGradient: 'from-blue-600 to-cyan-400',
  },
  amber: {
    id: 'amber',
    name: 'Harvest Amber',
    badgeLabel: 'Gold',
    hex: '#f59e0b',
    secondaryHex: '#fbbf24',
    tertiaryHex: '#d97706',
    chartStroke: '#f59e0b',
    chartFill: '#f59e0b',
    donutColors: ['#f59e0b', '#fbbf24', '#d97706'],
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80',
    btnPrimary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20',
    textAccent: 'text-amber-600 dark:text-amber-400',
    glowBg: 'bg-amber-500/10',
    borderAccent: 'border-amber-500/40 hover:border-amber-500',
    progressBarGradient: 'from-amber-500 to-yellow-400',
  },
  emerald: {
    id: 'emerald',
    name: 'Living Emerald',
    badgeLabel: 'Green',
    hex: '#10b981',
    secondaryHex: '#34d399',
    tertiaryHex: '#059669',
    chartStroke: '#10b981',
    chartFill: '#10b981',
    donutColors: ['#10b981', '#34d399', '#059669'],
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80',
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
    textAccent: 'text-emerald-600 dark:text-emerald-400',
    glowBg: 'bg-emerald-500/10',
    borderAccent: 'border-emerald-500/40 hover:border-emerald-500',
    progressBarGradient: 'from-emerald-500 to-teal-400',
  },
  rose: {
    id: 'rose',
    name: 'Crimson Flame',
    badgeLabel: 'Red',
    hex: '#f43f5e',
    secondaryHex: '#fb7185',
    tertiaryHex: '#e11d48',
    chartStroke: '#f43f5e',
    chartFill: '#f43f5e',
    donutColors: ['#f43f5e', '#fb7185', '#e11d48'],
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80',
    btnPrimary: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20',
    textAccent: 'text-rose-600 dark:text-rose-400',
    glowBg: 'bg-rose-500/10',
    borderAccent: 'border-rose-500/40 hover:border-rose-500',
    progressBarGradient: 'from-rose-500 to-orange-400',
  },
  violet: {
    id: 'violet',
    name: 'Kingdom Violet',
    badgeLabel: 'Purple',
    hex: '#8b5cf6',
    secondaryHex: '#a78bfa',
    tertiaryHex: '#7c3aed',
    chartStroke: '#8b5cf6',
    chartFill: '#8b5cf6',
    donutColors: ['#8b5cf6', '#a78bfa', '#7c3aed'],
    badgeBg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/80',
    btnPrimary: 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20',
    textAccent: 'text-violet-600 dark:text-violet-400',
    glowBg: 'bg-violet-500/10',
    borderAccent: 'border-violet-500/40 hover:border-violet-500',
    progressBarGradient: 'from-violet-500 to-fuchsia-400',
  },
  indigo: {
    id: 'indigo',
    name: 'Deep Indigo',
    badgeLabel: 'Indigo',
    hex: '#6366f1',
    secondaryHex: '#818cf8',
    tertiaryHex: '#4f46e5',
    chartStroke: '#6366f1',
    chartFill: '#6366f1',
    donutColors: ['#6366f1', '#818cf8', '#4f46e5'],
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/80',
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20',
    textAccent: 'text-indigo-600 dark:text-indigo-400',
    glowBg: 'bg-indigo-500/10',
    borderAccent: 'border-indigo-500/40 hover:border-indigo-500',
    progressBarGradient: 'from-indigo-500 to-sky-400',
  },
};
