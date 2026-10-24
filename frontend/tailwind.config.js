/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens mapped to CSS variables for dynamic dark/light switching
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        // Single warm vermilion accent token
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subdued: 'var(--accent-subdued)',
        },
      },
      fontFamily: {
        // Geist Sans for UI, Geist Mono for metadata, Instrument Serif strictly for display headline
        sans: ["'Geist Sans'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
        mono: ["'Geist Mono'", "'SF Mono'", 'monospace'],
        serif: ["'Instrument Serif'", 'Georgia', 'serif'],
      },
      fontSize: {
        // Strict editorial type scale: 12/13/14/16/20/32/56 with tight tracking on large sizes
        '12': ['12px', { lineHeight: '1.4', letterSpacing: '+0.02em' }],
        '13': ['13px', { lineHeight: '1.4', letterSpacing: '+0.01em' }],
        '14': ['14px', { lineHeight: '1.5', letterSpacing: '0' }],
        '16': ['16px', { lineHeight: '1.55', letterSpacing: '0' }],
        '20': ['20px', { lineHeight: '1.35', letterSpacing: '-0.015em' }],
        '32': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '56': ['56px', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        // 10px for surfaces, 6px for controls/chips
        surface: '10px',
        control: '6px',
      },
      boxShadow: {
        // Shadows are strictly forbidden on cards; reserved solely for floating popovers
        popover: '0 4px 20px var(--shadow-popover)',
      },
      transitionDuration: {
        '150': '150ms',
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
