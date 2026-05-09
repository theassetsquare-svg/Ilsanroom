import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// 빌드 시점의 KST 날짜를 모든 페이지에 주입 → "마지막 업데이트" 실제 값으로 사용
function buildDateKST(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000); // UTC + 9
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __BUILD_DATE__: JSON.stringify(buildDateKST()),
  },
  build: {
    outDir: 'dist',
  },
});
