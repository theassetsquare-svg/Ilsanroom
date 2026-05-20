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
    // v28.0 — vendor splitting: 430KB 단일 청크 → 도메인별 분할
    // 첫 페인트(LCP)에 필요한 vendor-react만 즉시 로드, 나머지는 라우트별 lazy 시 동반
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]react[\\/]|[\\/]react-dom[\\/]/.test(id) && !id.includes('react-router') && !id.includes('react-helmet') && !id.includes('react-icons')) return 'vendor-react';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('react-helmet-async')) return 'vendor-helmet';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('lucide-react') || id.includes('react-icons')) return 'vendor-icons';
          if (id.includes('framer-motion')) return 'vendor-framer';
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-tiptap';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
