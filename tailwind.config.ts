import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'canvas-bg': '#1e1e1e',
        'panel-bg': '#2d2d2d',
        'panel-border': '#3d3d3d',
        'toolbar-bg': '#333333',
        'toolbar-hover': '#444444',
        'toolbar-active': '#0d99ff',
        'text-primary': '#ffffff',
        'text-secondary': '#ababab',
        'text-muted': '#777777',
        'accent': '#0d99ff',
        'accent-hover': '#0b85e0',
      },
    },
  },
  plugins: [],
};

export default config;
