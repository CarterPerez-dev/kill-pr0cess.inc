/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // I'm customizing the color palette for the dark, eerie aesthetic
      colors: {
        // I'm defining the primary color system
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee', // Main accent color
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // I'm defining secondary colors for variety
        secondary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Secondary accent
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // I'm extending the neutral palette for fine-grained control
        neutral: {
          25: '#fefefe',
          50: '#fafafa',
          100: '#f5f5f5',
          150: '#ededed',
          200: '#e5e5e5',
          250: '#dedede',
          300: '#d4d4d4',
          350: '#b5b5b5',
          400: '#a3a3a3',
          450: '#8b8b8b',
          500: '#737373',
          550: '#666666',
          600: '#525252',
          650: '#464646',
          700: '#404040',
          750: '#363636',
          800: '#262626',
          850: '#1f1f1f',
          900: '#171717',
          925: '#141414',
          950: '#0a0a0a',
        }
      },
      // I'm customizing fonts for the technical aesthetic
      fontFamily: {
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      // I'm adding custom animations for the performance showcase
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'matrix-rain': 'matrixRain 20s linear infinite',
        'glitch': 'glitch 0.5s ease-in-out',
      },
      // I'm defining custom keyframes for sophisticated animations
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '0.4' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(34, 211, 238, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)' },
        },
        matrixRain: {
          '0%': { transform: 'translateY(-100vh)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
      },
      // I'm customizing spacing for precise layouts
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // I'm adding custom border radius values
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // I'm customizing shadows for depth and atmosphere
      boxShadow: {
        'glow': '0 0 20px rgba(34, 211, 238, 0.3)',
        'glow-lg': '0 0 40px rgba(34, 211, 238, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(34, 211, 238, 0.2)',
        'dark': '0 10px 25px rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 20px 40px rgba(0, 0, 0, 0.7)',
      },
      // I'm customizing backdrop blur for glass effects
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      // I'm adding custom gradients for the performance theme
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
      },
      // I'm customizing line clamp for text truncation
      lineClamp: {
        7: '7',
        8: '8',
        9: '9',
        10: '10',
      },
    },
  },
  plugins: [
    // I'm adding custom utilities for the performance showcase
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.7)',
        },
        '.border-gradient': {
          border: '1px solid transparent',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0)), linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(99, 102, 241, 0.3))',
          backgroundOrigin: 'border-box',
          backgroundClip: 'content-box, border-box',
        },
        '.glass': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.performance-grid': {
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(34, 211, 238, 0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        },
      }
      addUtilities(newUtilities)
    },
    // I'm adding line clamp plugin for text truncation
    require('@tailwindcss/line-clamp'),
  ],
}
