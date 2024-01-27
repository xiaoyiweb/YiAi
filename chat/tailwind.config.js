/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  purge: false,
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
			screens: {
        '3xl': '1750px',
        '4xl': '1870px',
      },
      animation: {
        blink: 'blink 1.2s infinite steps(1, start)',
      },
      keyframes: {
        blink: {
          '0%, 100%': { 'background-color': 'currentColor' },
          '50%': { 'background-color': 'transparent' },
        },
      },
      width: {
        sider: '60px',
      },
      textColor: {
        primary: '#409eff',
      },
      minHeight: {
        28: '28px',
      },
      backgroundColor: {
        lightBg: 'linear-gradient(145deg, #F7F9FA 0%, #D9E9F0 50%, #F7F9FA 100%)',
      },
    },
  },
  plugins: ['@tailwindcss/typography'],
}
