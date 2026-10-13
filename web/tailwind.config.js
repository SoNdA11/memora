/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // Background levels
        'lumi-bg':       'var(--lumi-bg)',
        'lumi-surface':  'var(--lumi-surface)',
        'lumi-surface2': 'var(--lumi-surface2)',

        // Borders
        'lumi-border':   'var(--lumi-border)',
        'lumi-border2':  'var(--lumi-border2)',

        // Text
        'lumi-text':     'var(--lumi-text)',
        'lumi-text2':    'var(--lumi-text2)',
        'lumi-text3':    'var(--lumi-text3)',

        // Brand accent
        'lumi-accent':   'var(--lumi-accent)',
        'lumi-accent2':  'var(--lumi-accent2)',
        'lumi-ring':     'var(--lumi-ring)',

        // Semantic
        'lumi-success':  'var(--lumi-success)',
        'lumi-warning':  'var(--lumi-warning)',
        'lumi-danger':   'var(--lumi-danger)',

        // Legacy aliases (keep --apple-* mapped so existing classes don't break during migration)
        'apple-bg':               'var(--lumi-bg)',
        'apple-surface':          'var(--lumi-surface)',
        'apple-border':           'var(--lumi-border)',
        'apple-border-hover':     'var(--lumi-border2)',
        'apple-text':             'var(--lumi-text)',
        'apple-text-secondary':   'var(--lumi-text2)',
        'apple-accent':           'var(--lumi-accent)',
        'apple-accent-hover':     'var(--lumi-accent2)',
        'apple-selection':        'var(--lumi-selection)',
        'apple-success':          'var(--lumi-success)',
        'apple-warning':          'var(--lumi-warning)',
        'apple-danger':           'var(--lumi-danger)',

        // shadcn/ui tokens — mapeados para a identidade Memora (violeta)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontSize: {
        // Micro text — minimum for UI
        'micro':  ['11px', { lineHeight: '16px', letterSpacing: '0.02em' }],
        // Caption
        'caption': ['12px', { lineHeight: '18px', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Lumi scale
        'lumi-xs': '4px',
        'lumi-sm': '6px',
        'lumi':    '8px',
        'lumi-md': '10px',
        'lumi-lg': '12px',
        'lumi-xl': '16px',
        'lumi-2xl': '20px',
        // Legacy aliases
        'apple':    '12px',
        'apple-sm': '8px',
        'apple-md': '10px',
        'apple-lg': '14px',
        'apple-xl': '18px',
        'apple-2xl': '24px',
      },
      boxShadow: {
        // Lumi shadows — refined for light & dark
        'lumi-xs': '0 1px 2px rgba(0,0,0,0.04)',
        'lumi-sm': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'lumi-md': '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
        'lumi-lg': '0 10px 15px rgba(0,0,0,0.07), 0 4px 6px rgba(0,0,0,0.05)',
        'lumi-xl': '0 20px 25px rgba(0,0,0,0.08), 0 10px 10px rgba(0,0,0,0.04)',
        'lumi-glow': '0 0 0 3px var(--lumi-ring)',
        'lumi-accent': '0 0 20px rgba(124,58,237,0.18)',
        // Legacy aliases
        'apple-sm':    '0 1px 2px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02)',
        'apple-md':    '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'apple-lg':    '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'apple-xl':    '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04)',
        'apple-2xl':   '0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
        'apple-glow':  '0 0 20px rgba(99,102,241,0.15)',
        'apple-glow-lg': '0 0 40px rgba(99,102,241,0.2)',
      },
      animation: {
        'fade-in':     'fadeIn 0.2s ease-out',
        'fade-in-up':  'fadeInUp 0.2s ease-out',
        'fade-in-down':'fadeInDown 0.2s ease-out',
        'scale-in':    'scaleIn 0.15s ease-out',
        'slide-up':    'slideUp 0.2s ease-out',
        'slide-down':  'slideDown 0.15s ease-out',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'shimmer':     'shimmer 1.6s infinite linear',
        'progress':    'progress 0.8s ease-out',
        'spin-slow':   'spin 3s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        progress: {
          '0%': { width: '0%' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}
