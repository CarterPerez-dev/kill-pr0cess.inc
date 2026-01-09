/*
 * ©AngelaMos | 2025
 */

interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };
  border: {
    primary: string;
    secondary: string;
    accent: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

interface TypographyScale {
  'xs': string;
  'sm': string;
  'base': string;
  'lg': string;
  'xl': string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
}

interface SpacingScale {
  '0': string;
  '1': string;
  '2': string;
  '3': string;
  '4': string;
  '6': string;
  '8': string;
  '12': string;
  '16': string;
  '20': string;
  '24': string;
  '32': string;
}

// I'm defining the core dark theme palette inspired by Mr. Robot's aesthetic
export const darkTheme: ColorPalette = {
  name: 'Dark Contemplation',
  primary: '#22d3ee', // Cyan accent for technical elements
  secondary: '#6366f1', // Indigo for secondary actions
  accent: '#a855f7', // Purple for highlights and special elements
  background: {
    primary: '#000000', // Pure black for maximum contrast
    secondary: '#0a0a0a', // Subtle variation for layering
    tertiary: '#171717', // Cards and elevated surfaces
  },
  text: {
    primary: '#f5f5f5', // Almost white for primary text
    secondary: '#a3a3a3', // Gray for secondary text
    tertiary: '#737373', // Darker gray for tertiary text
    muted: '#525252', // Muted text for less important info
  },
  border: {
    primary: '#262626', // Subtle borders
    secondary: '#404040', // More visible borders
    accent: '#22d3ee', // Accent borders for highlights
  },
  semantic: {
    success: '#22c55e', // Green for success states
    warning: '#f59e0b', // Amber for warnings
    error: '#ef4444', // Red for errors
    info: '#3b82f6', // Blue for informational states
  },
};

// I'm creating alternative theme variations for different moods
export const themeVariations = {
  matrix: {
    ...darkTheme,
    name: 'Matrix Code',
    primary: '#00ff00',
    accent: '#66ff66',
    background: {
      primary: '#000000',
      secondary: '#001100',
      tertiary: '#002200',
    },
  },

  cyberpunk: {
    ...darkTheme,
    name: 'Cyberpunk Neon',
    primary: '#ff0080',
    secondary: '#8000ff',
    accent: '#00ffff',
    background: {
      primary: '#0a0a0a',
      secondary: '#1a0a1a',
      tertiary: '#2a1a2a',
    },
  },

  void: {
    ...darkTheme,
    name: 'Void Meditation',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#a855f7',
    background: {
      primary: '#000000',
      secondary: '#0f0f0f',
      tertiary: '#1f1f1f',
    },
  },
};

// I'm defining typography scales for consistent text hierarchy
export const typography: TypographyScale = {
  'xs': '0.75rem', // 12px
  'sm': '0.875rem', // 14px
  'base': '1rem', // 16px
  'lg': '1.125rem', // 18px
  'xl': '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
  '6xl': '4rem', // 64px
};

// I'm defining spacing scale for consistent layout
export const spacing: SpacingScale = {
  '0': '0',
  '1': '0.25rem', // 4px
  '2': '0.5rem', // 8px
  '3': '0.75rem', // 12px
  '4': '1rem', // 16px
  '6': '1.5rem', // 24px
  '8': '2rem', // 32px
  '12': '3rem', // 48px
  '16': '4rem', // 64px
  '20': '5rem', // 80px
  '24': '6rem', // 96px
  '32': '8rem', // 128px
};

// I'm creating CSS custom properties for dynamic theming
export const generateCSSVariables = (theme: ColorPalette): string => {
  return `
    :root {
      --color-primary: ${theme.primary};
      --color-secondary: ${theme.secondary};
      --color-accent: ${theme.accent};

      --bg-primary: ${theme.background.primary};
      --bg-secondary: ${theme.background.secondary};
      --bg-tertiary: ${theme.background.tertiary};

      --text-primary: ${theme.text.primary};
      --text-secondary: ${theme.text.secondary};
      --text-tertiary: ${theme.text.tertiary};
      --text-muted: ${theme.text.muted};

      --border-primary: ${theme.border.primary};
      --border-secondary: ${theme.border.secondary};
      --border-accent: ${theme.border.accent};

      --color-success: ${theme.semantic.success};
      --color-warning: ${theme.semantic.warning};
      --color-error: ${theme.semantic.error};
      --color-info: ${theme.semantic.info};

      /* Typography scale */
      ${Object.entries(typography)
        .map(([key, value]) => `--text-${key}: ${value};`)
        .join('\n      ')}

      /* Spacing scale */
      ${Object.entries(spacing)
        .map(([key, value]) => `--space-${key}: ${value};`)
        .join('\n      ')}
    }
  `;
};

// I'm creating theme application utilities
export const applyTheme = (theme: ColorPalette = darkTheme) => {
  const style = document.createElement('style');
  style.id = 'theme-variables';

  // Remove existing theme if present
  const existing = document.getElementById('theme-variables');
  if (existing) {
    existing.remove();
  }

  style.textContent = generateCSSVariables(theme);
  document.head.appendChild(style);

  // I'm also updating the document class for theme-specific styles
  document.documentElement.className = `theme-${theme.name.toLowerCase().replace(/\s+/g, '-')}`;
};

// I'm creating dynamic color utilities for programmatic styling
export const colorUtils = {
  // Convert hex to HSL for programmatic manipulation
  hexToHsl: (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  },

  // Generate color variations
  lighten: (hex: string, amount: number): string => {
    const [h, s, l] = colorUtils.hexToHsl(hex);
    return colorUtils.hslToHex(h, s, Math.min(100, l + amount));
  },

  darken: (hex: string, amount: number): string => {
    const [h, s, l] = colorUtils.hexToHsl(hex);
    return colorUtils.hslToHex(h, s, Math.max(0, l - amount));
  },

  // Convert HSL back to hex
  hslToHex: (h: number, s: number, l: number): string => {
    h = h % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (300 <= h && h < 360) {
      r = c;
      g = 0;
      b = x;
    }

    const red = Math.round((r + m) * 255);
    const green = Math.round((g + m) * 255);
    const blue = Math.round((b + m) * 255);

    return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
  },

  // Add alpha channel to hex color
  addAlpha: (hex: string, alpha: number): string => {
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0');
    return `${hex}${alphaHex}`;
  },

  // Generate gradient stops
  generateGradient: (
    startColor: string,
    endColor: string,
    steps: number,
  ): string[] => {
    const [h1, s1, l1] = colorUtils.hexToHsl(startColor);
    const [h2, s2, l2] = colorUtils.hexToHsl(endColor);

    const colors = [];
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const h = h1 + (h2 - h1) * ratio;
      const s = s1 + (s2 - s1) * ratio;
      const l = l1 + (l2 - l1) * ratio;
      colors.push(colorUtils.hslToHex(h, s, l));
    }

    return colors;
  },
};

// I'm creating responsive breakpoint utilities
export const breakpoints = {
  'xs': '0px',
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
};

// I'm providing theme-aware component utilities
export const themeComponents = {
  // Generate button variants based on current theme
  generateButtonStyles: (theme: ColorPalette) => ({
    primary: {
      'backgroundColor': theme.primary,
      'color': theme.background.primary,
      'border': `1px solid ${theme.primary}`,
      '&:hover': {
        backgroundColor: colorUtils.lighten(theme.primary, 10),
      },
    },
    secondary: {
      'backgroundColor': 'transparent',
      'color': theme.text.primary,
      'border': `1px solid ${theme.border.secondary}`,
      '&:hover': {
        backgroundColor: theme.background.tertiary,
      },
    },
    ghost: {
      'backgroundColor': 'transparent',
      'color': theme.text.secondary,
      'border': 'none',
      '&:hover': {
        backgroundColor: theme.background.secondary,
        color: theme.text.primary,
      },
    },
  }),

  // Generate card styles
  generateCardStyles: (theme: ColorPalette) => ({
    'backgroundColor': theme.background.tertiary,
    'border': `1px solid ${theme.border.primary}`,
    'color': theme.text.primary,
    '&:hover': {
      borderColor: theme.border.secondary,
    },
  }),

  // Generate input styles
  generateInputStyles: (theme: ColorPalette) => ({
    'backgroundColor': theme.background.secondary,
    'border': `1px solid ${theme.border.primary}`,
    'color': theme.text.primary,
    '&:focus': {
      borderColor: theme.primary,
      outline: 'none',
      boxShadow: `0 0 0 2px ${colorUtils.addAlpha(theme.primary, 0.2)}`,
    },
    '&::placeholder': {
      color: theme.text.muted,
    },
  }),
};

// I'm creating theme persistence utilities
export const themeStorage = {
  save: (themeName: string) => {
    try {
      localStorage.setItem('app-theme', themeName);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  },

  load: (): string | null => {
    try {
      return localStorage.getItem('app-theme');
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      return null;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem('app-theme');
    } catch (error) {
      console.warn('Failed to clear theme preference:', error);
    }
  },
};

// I'm providing system theme detection
export const systemTheme = {
  isDarkMode: (): boolean => {
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  },

  onChange: (callback: (isDark: boolean) => void) => {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handler = (e: MediaQueryListEvent) => {
        callback(e.matches);
      };

      mediaQuery.addEventListener('change', handler);

      return () => mediaQuery.removeEventListener('change', handler);
    }

    return () => {}; // No-op cleanup for unsupported browsers
  },
};

// I'm creating theme initialization with proper defaults
export const initializeTheme = () => {
  // Check for saved preference first
  const savedTheme = themeStorage.load();

  if (savedTheme) {
    const theme =
      Object.values({ darkTheme, ...themeVariations }).find(
        (t) => t.name === savedTheme,
      ) || darkTheme;
    applyTheme(theme);
    return;
  }

  // Fall back to system preference or default dark theme
  const isDarkSystem = systemTheme.isDarkMode();
  applyTheme(darkTheme); // Always use dark theme for this app's aesthetic

  // Listen for system theme changes
  systemTheme.onChange((isDark) => {
    // We always stay dark for this app, but could adjust intensity
    // For now, just maintain the dark theme
    applyTheme(darkTheme);
  });
};

// I'm providing Tailwind CSS integration utilities
export const tailwindIntegration = {
  // Generate Tailwind config extensions for our theme
  generateTailwindTheme: (theme: ColorPalette) => ({
    extend: {
      colors: {
        'primary': theme.primary,
        'secondary': theme.secondary,
        'accent': theme.accent,
        'bg-primary': theme.background.primary,
        'bg-secondary': theme.background.secondary,
        'bg-tertiary': theme.background.tertiary,
        'text-primary': theme.text.primary,
        'text-secondary': theme.text.secondary,
        'text-tertiary': theme.text.tertiary,
        'text-muted': theme.text.muted,
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
    },
  }),
};

// Export the default theme and initialization function
export { darkTheme as defaultTheme, initializeTheme as init };
