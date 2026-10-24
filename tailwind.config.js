/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Standard blue (for marking palette) — preserved
        blue: {
          300: '#6890e0',
          400: '#4870c8',
          500: '#3050a8',
        },
        // Standard red (for marking palette) — preserved
        red: {
          300: '#e87060',
          400: '#d04838',
          500: '#b83020',
        },
        // Standard purple (for marking palette) — preserved
        purple: {
          300: '#c890e0',
          400: '#a868d0',
          500: '#8848b8',
        },
        // Warm parchment / cream backgrounds (daylight theme)
        ink: {
          950: '#EDE7D9', // main app background — warm parchment
          900: '#F5F0E5', // surface — lighter cream
          850: '#F8F4EC', // elevated surface
          800: '#FBF8F1', // cards / inputs — near-white cream
          750: '#E5DDC9', // subtle surface variant
          700: '#D6CDBA', // borders
          600: '#C0B59C', // medium borders
          500: '#A89E85', // strong borders / muted surfaces
        },
        // Warm dark text (daylight theme)
        ivory: {
          50: '#1F1B16', // primary text — dark warm brown
          100: '#2A241E', // body text
          200: '#3D362E', // secondary text
          300: '#5A4F44', // muted text
          400: '#756B5C', // ghost buttons
          500: '#8E8273', // labels
          600: '#A89E8C', // placeholder text
        },
        // Warm gold accents — darkened for light-bg contrast
        gold: {
          50: '#FAF3E0',
          100: '#F0E0B8',
          200: '#E0C880',
          300: '#B8912F', // scripture refs — readable on cream
          400: '#9A7820', // primary accent
          500: '#7A5A20', // darker accent / borders
          600: '#5E4419', // button gradient end
          700: '#4A3513',
          800: '#3A2A0F',
        },
        // Secondary — muted sage (darkened for light bg)
        sage: {
          300: '#7A9E77',
          400: '#5E8B5B',
          500: '#4A7548',
          600: '#3A5E38',
        },
        // Accent — soft terracotta (darkened for light bg)
        clay: {
          400: '#A87858',
          500: '#8E5F3E',
          600: '#7A4E30',
        },
        // Expanded marking palette — preserved
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
        // Semantic — darkened for light bg
        success: '#4A7548',
        warning: '#B08820',
        error: '#A8584E',
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
        'parchment': "radial-gradient(ellipse at top, rgba(154,120,32,0.07) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(154,120,32,0.04) 0%, transparent 50%)",
        'warm-radial': 'radial-gradient(ellipse at center top, rgba(154,120,32,0.06) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
