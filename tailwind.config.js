/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // PMPlatto Green Theme (自然と成長をイメージ)
        primary: '#10B981',      // Emerald 500
        secondary: '#ECFDF5',    // Green 50
        accent: '#34D399',       // Emerald 400
        text: {
          primary: '#1E293B',    // Slate Gray
          secondary: '#64748B'   // Lighter Slate
        },
        // PMPlatto Episode Status Colors (Green系統)
        episodeStatus: {
          '台本作成中': '#94A3B8',    // Slate 400 (開始段階は灰色)
          '素材準備': '#84CC16',      // Lime 500  
          '素材確定': '#65A30D',      // Lime 600
          '編集中': '#22C55E',        // Green 500
          '試写1': '#16A34A',         // Green 600
          '修正1': '#15803D',         // Green 700
          'MA中': '#166534',          // Green 800
          '初稿完成': '#059669',      // Emerald 600
          '修正中': '#DC2626',        // Red 600 (修正は赤で注意喚起)
          '完パケ納品': '#047857'     // Emerald 700 (完了は深い緑)
        },
        // Original Program Status Colors (Green系統に統一)
        status: {
          'キャスティング中': '#DCFCE7',  // Green 100
          '日程調整中': '#BBF7D0',      // Green 200
          'ロケハン前': '#86EFAC',       // Green 300
          '収録準備中': '#4ADE80',      // Green 400
          '編集中': '#22C55E',          // Green 500
          '試写中': '#16A34A',          // Green 600
          'MA中': '#15803D',            // Green 700
          '完パケ納品': '#166534',      // Green 800
          '放送済み': '#14532D'         // Green 900
        }
      }
    }
  },
  plugins: []
};