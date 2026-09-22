import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColorPaletteKey, ColorPalette, COLOR_PALETTES } from '../lib/theme';

export type GlassBlurIntensity = 'low' | 'normal' | 'high';

interface ThemeContextType {
  theme: 'dark' | 'light';
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  toggleTheme: () => void;
  colorTheme: ColorPaletteKey;
  setColorTheme: (color: ColorPaletteKey) => void;
  palette: ColorPalette;
  glassBlur: GlassBlurIntensity;
  setGlassBlur: (blur: GlassBlurIntensity) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('harvest_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [colorTheme, setColorThemeState] = useState<ColorPaletteKey>(() => {
    const saved = localStorage.getItem('harvest_color_theme');
    if (saved && saved in COLOR_PALETTES) {
      return saved as ColorPaletteKey;
    }
    return 'bento';
  });

  const [glassBlur, setGlassBlurState] = useState<GlassBlurIntensity>(() => {
    const saved = localStorage.getItem('harvest_glass_blur');
    if (saved === 'low' || saved === 'normal' || saved === 'high') {
      return saved;
    }
    return 'normal';
  });

  useEffect(() => {
    localStorage.setItem('harvest_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('harvest_glass_blur', glassBlur);
    const root = document.documentElement;
    root.setAttribute('data-glass-blur', glassBlur);
  }, [glassBlur]);

  const setColorTheme = (color: ColorPaletteKey) => {
    setColorThemeState(color);
    localStorage.setItem('harvest_color_theme', color);
  };

  const setGlassBlur = (blur: GlassBlurIntensity) => {
    setGlassBlurState(blur);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const palette = COLOR_PALETTES[colorTheme] || COLOR_PALETTES.bento;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        colorTheme,
        setColorTheme,
        palette,
        glassBlur,
        setGlassBlur,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
