'use client';

import { useState } from 'react';
import { venues } from '@/data/venues';

const CAT_LABELS: Record<string, string> = { club: 'EDM존', night: '댄스존', lounge: '바존', room: '개인실', yojeong: '한식관', hoppa: '호스트존' };
const CAT_COLORS: Record<string, string> = { club: '#7c3aed', night: '#ec4899', lounge: '#06b6d4', room: '#f59e0b', yojeong: '#ef4444', hoppa: '#f472b6' };

const galleryItems = venues
  .filter((v) => v.status !== 'closed_or_unclear')
  .slice(0, 24)
  .map((v, i) => ({
    id: v.id,
    venueName: v.nameKo,
    category: v.category,
    region: v.regionKo,
    shortDesc: v.shortDescription,
    height: ['h-56', 'h-44', 'h-52', 'h-48', 'h-60'][i % 5],
  }));

export default function GalleryPage() {
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? galleryItems : galleryItems.filter((g) => g.category === filter);
  const lightboxItem = lightboxId ? galleryItems.find((g) => g.id === lightboxId) : null;
  const lightboxIdx = lightboxItem ? filtered.indexOf(lightboxItem) : -1;

  const goPrev = () => {
    if (lightboxIdx > 0) setLightboxId(filtered[lightboxIdx - 1].id);
  };
  const goNext = () => {
    if (lightboxIdx < filtered.length - 1) setLightboxId(filtered[lightboxIdx + 1].id);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-neon-text mb-1">포토 갤러리</h1>
      <p className="text-sm text-neon-text-muted mb-6">현장 분위기를 사진으로 확인하세요</p>

      {/* 필터 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === 'all' ? 'bg-neon-primary text-white' : 'bg-neon-surface-2 text-neon-text-muted'}`}
          style={{ minHeight: 32 }}>전체</button>
        {Object.entries(CAT_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === k ? 'text-white' : 'bg-neon-surface-2 text-neon-text-muted'}`}
            style={filter === k ? { backgroundColor: CAT_COLORS[k], minHeight: 32 } : { minHeight: 32 }}>
            {v}
          </button>
        ))}
      </div>

      {/* Masonry */}
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => setLightboxId(item.id)}
            className={`mb-3 w-full break-inside-avoid overflow-hidden rounded-xl border border-neon-border bg-neon-surface-2 transition hover:border-neon-primary/40 ${item.height}`}
          >
            <div className="flex h-full flex-col items-center justify-center p-4 text-center gap-2">
              <span className="text-3xl opacity-20">
                {item.category === 'club' ? '🎵' : item.category === 'night' ? '🌙' : item.category === 'lounge' ? '🍸' : item.category === 'room' ? '🚪' : item.category === 'yojeong' ? '🏮' : '🥂'}
              </span>
              <span className="text-xs font-medium text-neon-text">{item.venueName}</span>
              <span className="text-[10px] text-neon-text-muted">{item.region} · {CAT_LABELS[item.category]}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={() => setLightboxId(null)}>
          <div className="relative max-w-lg w-full mx-4 rounded-2xl bg-neon-surface p-6 sm:p-8 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxId(null)} className="absolute top-3 right-3 text-neon-text-muted hover:text-neon-text text-lg" style={{ minWidth: 40, minHeight: 40 }}>✕</button>

            <div className="h-52 sm:h-64 rounded-xl bg-neon-surface-2 flex items-center justify-center mb-4">
              <span className="text-5xl opacity-20">
                {lightboxItem.category === 'club' ? '🎵' : lightboxItem.category === 'night' ? '🌙' : lightboxItem.category === 'lounge' ? '🍸' : lightboxItem.category === 'room' ? '🚪' : lightboxItem.category === 'yojeong' ? '🏮' : '🥂'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-neon-text mb-1">{lightboxItem.venueName}</h3>
            <p className="text-xs text-neon-text-muted mb-2">{lightboxItem.region} · {CAT_LABELS[lightboxItem.category]}</p>
            <p className="text-xs text-neon-text-muted/80 leading-relaxed">{lightboxItem.shortDesc}</p>

            {/* Prev / Next */}
            <div className="flex justify-between mt-5">
              <button onClick={goPrev} disabled={lightboxIdx <= 0}
                className="rounded-lg bg-neon-surface-2 px-4 py-2 text-xs text-neon-text-muted disabled:opacity-30 hover:text-neon-text transition"
                style={{ minHeight: 40 }}>← 이전</button>
              <button onClick={goNext} disabled={lightboxIdx >= filtered.length - 1}
                className="rounded-lg bg-neon-surface-2 px-4 py-2 text-xs text-neon-text-muted disabled:opacity-30 hover:text-neon-text transition"
                style={{ minHeight: 40 }}>다음 →</button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-[10px] text-neon-text-muted/50">업소 실제 사진은 업주 등록 후 게시됩니다</p>
    </div>
  );
}
