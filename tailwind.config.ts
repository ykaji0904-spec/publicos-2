import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'pos-primary': '#0A1628',
        'pos-accent': '#3B82F6',
        'pos-surface': '#111827',
        'pos-border': '#1F2937',
        'pos-text': '#E5E7EB',
        'pos-muted': '#6B7280',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
