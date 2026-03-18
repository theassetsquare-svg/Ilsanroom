import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '오늘밤어디',
    short_name: '오늘밤어디',
    description: '전국 클럽, 나이트, 라운지, 룸, 요정, 호빠 실시간 정보',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8B5CF6',
    icons: [
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
  };
}
