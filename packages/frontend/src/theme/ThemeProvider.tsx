import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface OrganizationBranding {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  logoUrl?: string;
  companyName: string;
  favicon?: string;
  customCSS?: string;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  branding?: OrganizationBranding;
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
}

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  branding?: OrganizationBranding;
  setBranding: (branding: OrganizationBranding) => void;
  themeConfig: ThemeConfig;
  updateThemeConfig: (config: Partial<ThemeConfig>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  defaultBranding?: OrganizationBranding;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'dark',
  defaultBranding 
}) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return localStorage.getItem('theme') || defaultTheme;
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    if (typeof window === 'undefined') {
      return { mode: defaultTheme as 'light' | 'dark', branding: defaultBranding };
    }
    
    try {
      const savedConfig = localStorage.getItem('themeConfig');
      return savedConfig ? JSON.parse(savedConfig) : { mode: theme as 'light' | 'dark', branding: defaultBranding };
    } catch {
      return { mode: theme as 'light' | 'dark', branding: defaultBranding };
    }
  });

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    setThemeConfig(prev => ({ ...prev, mode: newTheme as 'light' | 'dark' }));
  };

  const setBranding = (branding: OrganizationBranding) => {
    setThemeConfig(prev => ({ ...prev, branding }));
  };

  const updateThemeConfig = (config: Partial<ThemeConfig>) => {
    setThemeConfig(prev => ({ ...prev, ...config }));
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply custom branding colors
    if (themeConfig.branding) {
      root.style.setProperty('--color-primary', themeConfig.branding.primaryColor);
      root.style.setProperty('--color-secondary', themeConfig.branding.secondaryColor);
      
      // Update favicon if provided
      if (themeConfig.branding.favicon) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = themeConfig.branding.favicon;
        }
      }
      
      // Update page title with company name
      if (themeConfig.branding.companyName) {
        document.title = `Intelligent Engineering Platform - ${themeConfig.branding.companyName}`;
      }
      
      // Apply custom CSS
      if (themeConfig.branding.customCSS) {
        let customStyleElement = document.getElementById('custom-branding-styles');
        if (!customStyleElement) {
          customStyleElement = document.createElement('style');
          customStyleElement.id = 'custom-branding-styles';
          document.head.appendChild(customStyleElement);
        }
        customStyleElement.textContent = themeConfig.branding.customCSS;
      }
    }
    
    // Apply custom colors
    if (themeConfig.customColors) {
      Object.entries(themeConfig.customColors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('themeConfig', JSON.stringify(themeConfig));
  }, [theme, themeConfig]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      branding: themeConfig.branding,
      setBranding,
      themeConfig,
      updateThemeConfig
    }}>
      {children}
    </ThemeContext.Provider>
  );
};