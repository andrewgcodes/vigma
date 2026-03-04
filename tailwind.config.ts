import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: 'var(--canvas-bg)',
          surface: 'var(--canvas-surface)',
          border: 'var(--canvas-border)',
          hover: 'var(--canvas-hover)',
          active: 'var(--canvas-active)',
          text: 'var(--canvas-text)',
          'text-secondary': 'var(--canvas-text-secondary)',
          'text-tertiary': 'var(--canvas-text-tertiary)',
          accent: 'var(--canvas-accent)',
          'accent-hover': 'var(--canvas-accent-hover)',
          'accent-light': 'var(--canvas-accent-light)',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xxs': '0.625rem',
      },
      boxShadow: {
        'panel': '0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.08)',
        'panel-lg': '0 0 0 1px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.12)',
        'toolbar': '0 2px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      }
    },
  },
  plugins: [],
}
export default config
