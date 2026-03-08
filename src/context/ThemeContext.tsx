
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type FontFamily = 'inter' | 'poppins' | 'bebas' | 'playfair' | 'roboto' | 'montserrat';

const FONT_MAP: Record<FontFamily, string> = {
  inter: "'Inter', sans-serif",
  poppins: "'Poppins', sans-serif",
  bebas: "'Bebas Neue', sans-serif",
  playfair: "'Playfair Display', serif",
  roboto: "'Roboto', sans-serif",
  montserrat: "'Montserrat', sans-serif",
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  availableFonts: { value: FontFamily; label: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const availableFonts: { value: FontFamily; label: string }[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'bebas', label: 'Bebas Neue' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'montserrat', label: 'Montserrat' },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) return savedTheme;
    return 'light';
  });

  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
    const saved = localStorage.getItem('fontFamily') as FontFamily;
    return saved || 'inter';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily);
    document.documentElement.style.fontFamily = FONT_MAP[fontFamily];
  }, [fontFamily]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setFontFamily = (font: FontFamily) => {
    setFontFamilyState(font);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, fontFamily, setFontFamily, availableFonts }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
