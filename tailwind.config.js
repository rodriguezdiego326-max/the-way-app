/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Standard blue (for marking palette)
        blue: {
          300: '#6890e0',
          400: '#4870c8',
          500: '#3050a8',
        },
        // Standard red (for marking palette)
        red: {
          300: '#e87060',
          400: '#d04838',
          500: '#b83020',
        },
        // Standard purple (for marking palette)
        purple: {
          300: '#c890e0',
          400: '#a868d0',
          500: '#8848b8',
        },
        // Deep charcoal / near-black backgrounds
        ink: {
          950: '#0a0908',
          900: '#100e0c',
          850: '#16130f',
          800: '#1c1814',
          750: '#221d18',
          700: '#2a241e',
          600: '#3a322a',
          500: '#4a4036',
        },
        // Warm ivory text
        ivory: {
          50: '#faf7f0',
          100: '#f5f0e6',
          200: '#ebe3d4',
          300: '#d9cfba',
          400: '#c4b89e',
          500: '#a89e85',
          600: '#8a7f68',
        },
        // Restrained warm gold accents
        gold: {
          50: '#fbf6e9',
          100: '#f5e9c8',
          200: '#e9d49b',
          300: '#dcbf6e',
          400: '#cda847',
          500: '#b8912f',
          600: '#9a7527',
          700: '#7a5a20',
          800: '#5c4419',
        },
        // Secondary — muted sage (for quiet, peaceful accents)
        sage: {
          300: '#a8c4a5',
          400: '#8ba888',
          500: '#6f906c',
          600: '#587356',
        },
        // Accent — soft terracotta (warm, earthy)
        clay: {
          400: '#c89b7a',
          500: '#b5825c',
          600: '#9a6b48',
        },
        // Expanded marking palette
        amber: {
          300: '#f0c350',
          400: '#e6b020',
          500: '#cc9a14',
        },
        orange: {
          300: '#f0a868',
          400: '#e08838',
          500: '#c87020',
        },
        coral: {
          300: '#f08575',
          400: '#e0685c',
          500: '#cc5048',
        },
        rose: {
          300: '#f08598',
          400: '#e06880',
          500: '#cc4870',
        },
        violet: {
          300: '#b898e8',
          400: '#9870d8',
          500: '#8050c8',
        },
        indigo: {
          300: '#7890e8',
          400: '#5870d8',
          500: '#4050c8',
        },
        teal: {
          300: '#50c8c0',
          400: '#30a8a0',
          500: '#208880',
        },
        // Semantic
        success: '#6f906c',
        warning: '#d4a542',
        error: '#c4756a',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        scripture: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      fontSize: {
        'scripture-lg': ['1.5rem', { lineHeight: '1.75', letterSpacing: '0.01em' }],
        'scripture-xl': ['1.875rem', { lineHeight: '1.7', letterSpacing: '0.005em' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.35s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'parchment': "radial-gradient(ellipse at top, rgba(205,168,71,0.04) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(205,168,71,0.02) 0%, transparent 50%)",
        'warm-radial': 'radial-gradient(ellipse at center top, rgba(205,168,71,0.06) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
