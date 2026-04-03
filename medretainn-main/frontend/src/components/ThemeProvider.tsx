import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const darkTheme = {
  background: '#0a0d12',
  surface: '#141921',
  primary: '#00d4a8',
  secondary: '#4cc9f0',
  accent: '#ffd166',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: 'rgba(255, 255, 255, 0.08)',
  success: '#00d4a8',
  warning: '#ffd166',
  error: '#ff6b6b',
  info: '#4cc9f0'
};

const lightTheme = {
  background: '#f8fafc',
  surface: '#ffffff',
  primary: '#00b894',
  secondary: '#0984e3',
  accent: '#e17055',
  text: '#2d3748',
  textSecondary: '#64748b',
  border: 'rgba(0, 0, 0, 0.1)',
  success: '#00b894',
  warning: '#e17055',
  error: '#d63031',
  info: '#0984e3'
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('medretain-theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('medretain-theme', theme);

    // Update CSS custom properties for theme
    const colors = theme === 'dark' ? darkTheme : lightTheme;
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    });

    // Update body background
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Toggle Button Component
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        color: colors.text,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: 'auto'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.primary + '20';
        e.currentTarget.style.borderColor = colors.primary + '40';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.surface;
        e.currentTarget.style.borderColor = colors.border;
      }}
    >
      <span style={{ fontSize: '16px' }}>
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
      <span style={{ fontSize: '12px', fontWeight: 500 }}>
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};