/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0F52BA',
        secondary: '#F5F7FA',
        accent: '#17C3B2',
        text: {
          primary: '#1A202C',
          secondary: '#718096'
        },
        status: {
          'キャスティング中': '#FBD38D',
          '日程調整中': '#BEE3F8',
          'ロケハン前': '#B2F5EA',
          '収録準備中': '#9AE6B4',
          '編集中': '#FC8181',
          '試写中': '#D6BCFA',
          'MA中': '#C6F6D5',
          '完パケ納品': '#CBD5E0',
          '放送済み': '#E2E8F0'
        }
      }
    }
  },
  plugins: []
};