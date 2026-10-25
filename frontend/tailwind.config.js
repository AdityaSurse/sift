/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens mapped to CSS variables for dynamic dark/light switching
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          subdued: 'var(--surface-subdued)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        // Aegean Marine Teal Accent
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subdued: 'var(--accent-subdued)',
        },
        // Caspian Slate Pill Button Tokens
        'btn-primary': {
          DEFAULT: 'var(--btn-primary)',
          hover: 'var(--btn-primary-hover)',
          text: 'var(--btn-primary-text)',
        },
      },
      fontFamily: {
        // Geist Sans for UI, Geist Mono for metadata, Instrument Serif strictly for display headline
        sans: ["'Geist Sans'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
        mono: ["'Geist Mono'", "'SF Mono'", 'monospace'],
        serif: ["'Instrument Serif'", 'Georgia', 'serif'],
      },
      fontSize: {
        '11': ['11px', { lineHeight: '1.4', letterSpacing: '+0.01em' }],
        '12': ['12px', { lineHeight: '1.4', letterSpacing: '+0.01em' }],
        '13': ['13px', { lineHeight: '1.4', letterSpacing: '0' }],
        '14': ['14px', { lineHeight: '1.5', letterSpacing: '0' }],
        '15': ['15px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        '16': ['16px', { lineHeight: '1.55', letterSpacing: '-0.01em' }],
        '18': ['18px', { lineHeight: '1.4', letterSpacing: '-0.015em' }],
        '20': ['20px', { lineHeight: '1.35', letterSpacing: '-0.015em' }],
        '24': ['24px', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        '32': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '40': ['40px', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        '48': ['48px', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '56': ['56px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        '64': ['64px', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        '2xl': '16px',
        xl: '12px',
        lg: '8px',
        surface: '12px',
        control: '8px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        popover: 'var(--shadow-popover)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
