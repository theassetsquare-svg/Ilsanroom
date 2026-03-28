import { useState } from 'react';

const categories = [
  { name: '해장국', emoji: '🍲', query: '일산 해장국' },
  { name: '라면',   emoji: '🍜', query: '일산 라면' },
  { name: '국밥',   emoji: '🥘', query: '일산 국밥' },
  { name: '치킨',   emoji: '🍗', query: '일산 치킨' },
  { name: '포장마차', emoji: '🏮', query: '일산 포장마차' },
];

function openKakaoMap(query: string) {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
}

export default function NearbyFood() {
  const [locating, setLocating] = useState(false);

  const handleNearby = (category: string) => {
    if (!navigator.geolocation) {
      openKakaoMap(category);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        window.open(
          `https://map.kakao.com/?q=${encodeURIComponent(category)}&x=${longitude}&y=${latitude}`,
          '_blank',
          'noopener,noreferrer',
        );
        setLocating(false);
      },
      () => {
        openKakaoMap(category);
        setLocating(false);
      },
      { timeout: 5000 },
    );
  };

  return (
    <div className="rounded-2xl border border-neon-gold/30 bg-neon-surface p-6">
      <h3 className="text-lg font-bold text-neon-text mb-2">주변 맛집 / 해장</h3>
      <p className="text-sm text-neon-text-muted mb-4">놀고 난 뒤 출출할 때, 근처 맛집을 바로 찾아보세요</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.name} className="flex flex-col gap-2 rounded-xl border border-neon-border bg-neon-bg p-3">
            <span className="text-2xl text-center">{cat.emoji}</span>
            <p className="text-sm font-medium text-neon-text text-center">{cat.name}</p>
            <a
              href={`https://map.kakao.com/?q=${encodeURIComponent(cat.query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[#FEE500] py-2 text-center text-xs font-bold text-neutral-900 transition hover:bg-[#FDD700]"
              style={{ minHeight: '36px' }}
            >
              카카오맵에서 찾기
            </a>
          </div>
        ))}

        {/* 내 위치 주변 버튼 */}
        <div className="flex flex-col gap-2 rounded-xl border border-neon-accent/40 bg-neon-bg p-3">
          <span className="text-2xl text-center">📍</span>
          <p className="text-sm font-medium text-neon-text text-center">내 위치 주변</p>
          <button
            onClick={() => handleNearby('맛집')}
            disabled={locating}
            className={`rounded-lg py-2 text-center text-xs font-bold transition ${
              locating
                ? 'bg-neon-surface-2 text-neon-text-muted'
                : 'bg-neon-accent/20 text-neon-accent hover:bg-neon-accent/30'
            }`}
            style={{ minHeight: '36px' }}
          >
            {locating ? '위치 확인 중...' : '내 위치로 검색'}
          </button>
        </div>
      </div>
    </div>
  );
}
