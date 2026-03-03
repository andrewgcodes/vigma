import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#f5f5f7',
          surface: '#ffffff',
          border: '#e5e5e7',
          hover: '#f0f0f2',
          active: '#e8e8ea',
          text: '#1d1d1f',
          'text-secondary': '#6e6e73',
          'text-tertiary': '#86868b',
          accent: '#0071e3',
          'accent-hover': '#0077ed',
          'accent-light': '#e8f4fd',
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
