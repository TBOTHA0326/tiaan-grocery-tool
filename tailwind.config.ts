import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f8fafc',
        panel: '#ffffff'
      },
      boxShadow: {
        soft: '0 30px 80px -50px rgba(15,23,42,0.18)',
        panel: '0 24px 60px -24px rgba(15,23,42,0.16)'
      }
    }
  },
  plugins: []
};

export default config;
