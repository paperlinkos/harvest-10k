import React, { useState } from 'react';
import { Modal } from './Modal';
import { useTheme } from '../context/ThemeContext';
import { COLOR_PALETTES, ColorPaletteKey } from '../lib/theme';
import { Sparkles, Check, Sliders, Palette, RotateCcw, Layout, Sun, Moon } from 'lucide-react';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (title: string, message: string) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const { theme, setTheme, colorTheme, setColorTheme, palette } = useTheme();
  const [customHex, setCustomHex] = useState(palette.hex);
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'spacious'>(() => {
    return (localStorage.getItem('harvest_ui_density') as any) || 'comfortable';
  });
  const [borderRadius, setBorderRadius] = useState<'rounded' | 'smooth' | 'sharp'>(() => {
    return (localStorage.getItem('harvest_ui_radius') as any) || 'rounded';
  });

  const handleSave = () => {
    localStorage.setItem('harvest_ui_density', density);
    localStorage.setItem('harvest_ui_radius', borderRadius);
    onSuccessToast('Theme & Templates Saved', 'Your custom UI branding template has been applied successfully across the app.');
    onClose();
  };

  const handleReset = () => {
    setColorTheme('amber');
    setTheme('light');
    setDensity('comfortable');
    setBorderRadius('rounded');
    localStorage.removeItem('harvest_ui_density');
    localStorage.removeItem('harvest_ui_radius');
    onSuccessToast('Settings Reset', 'Restored default Abuja Gold campaign template.');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Campaign Theme & UI Customizer" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Intro */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
          <Palette className="w-5 h-5 mt-0.5 shrink-0" style={{ color: palette.hex }} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Complete UI & Template Customization
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Customize the entire application branding, color palettes, visual templates, card corner radius, and layout density for current and upcoming ministry campaigns.
            </p>
          </div>
        </div>

        {/* 1. Preset Color Templates */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            1. Official Campaign Color Templates
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(COLOR_PALETTES) as ColorPaletteKey[]).map(key => {
              const p = COLOR_PALETTES[key];
              const isSelected = colorTheme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColorTheme(key)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-2 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                  style={{
                    borderColor: isSelected ? p.hex : undefined,
                    backgroundColor: isSelected ? `${p.hex}12` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-6 h-6 rounded-full shadow-xs flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: p.hex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {p.badgeLabel}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">{p.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Light / Dark Mode Preset */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            2. Base Appearance Template
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                theme === 'light'
                  ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Theme</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'border-slate-900 dark:border-slate-100 bg-slate-900 text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Executive Theme</span>
            </button>
          </div>
        </div>

        {/* 3. Layout Density & Corner Radius */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              3. UI Spacing Density
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'comfortable', 'spacious'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize cursor-pointer transition-all ${
                    density === d
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              4. Card Corner Radius
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['rounded', 'smooth', 'sharp'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setBorderRadius(r)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize cursor-pointer transition-all ${
                    borderRadius === r
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Live Preview Box
          </label>
          <div
            className={`p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 ${
              borderRadius === 'rounded' ? 'rounded-2xl' : borderRadius === 'smooth' ? 'rounded-lg' : 'rounded-none'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Abuja FCT Centre Sample</span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                style={{ backgroundColor: palette.hex }}
              >
                Active Template
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r" style={{ width: '75%', backgroundColor: palette.hex }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>7,500 / 10,000 Souls Won</span>
              <span className="font-bold" style={{ color: palette.hex }}>75% Target Achieved</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer ${palette.btnPrimary}`}
            >
              Apply Theme & Templates
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
