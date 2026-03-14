'use client';

import { useState } from 'react';
import { venues } from '@/data/venues';

const CATEGORY_LABELS: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

// Generate gallery items from venues
const galleryItems = venues
  .filter((v) => v.status !== 'closed_or_unclear')
  .slice(0, 24)
  .map((v, i) => ({
    id: v.id,
    venueName: v.nameKo,
    category: v.category,
    region: v.regionKo,
    // Masonry: alternate heights
    height: i % 3 === 0 ? 'h-64' : i % 3 === 1 ? 'h-48' : 'h-56',
  }));

export default function GalleryPage() {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? galleryItems : galleryItems.filter((g) => g.category === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-neon-text mb-2">갤러리</h1>
      <p className="text-neon-text-muted mb-8">전국 업소 현장 분위기</p>

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === 'all' ? 'bg-neon-primary text-white' : 'bg-neon-surface-2 text-neon-text-muted'}`}>전체</button>
        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === k ? 'bg-neon-primary text-white' : 'bg-neon-surface-2 text-neon-text-muted'}`}>{v}</button>
        ))}
      </div>

      {/* Masonry Grid */}
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => setLightbox(item.id)}
            className={`mb-3 w-full break-inside-avoid overflow-hidden rounded-xl border border-neon-border bg-neon-surface-2 transition hover:border-neon-primary/40 ${item.height}`}
          >
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <span className="text-neon-text-muted/30 text-2xl mb-2">📸</span>
              <span className="text-xs font-medium text-neon-text">{item.venueName}</span>
              <span className="text-[10px] text-neon-text-muted">{item.region} · {CATEGORY_LABELS[item.category]}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <div className="relative max-w-2xl w-full mx-4 rounded-2xl bg-neon-surface p-8 text-center animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-neon-text-muted hover:text-neon-text">✕</button>
            {(() => { const item = galleryItems.find((g) => g.id === lightbox); return item ? (
              <>
                <div className="h-64 rounded-xl bg-neon-surface-2 flex items-center justify-center mb-4">
                  <span className="text-neon-text-muted/30 text-4xl">📸</span>
                </div>
                <h3 className="text-lg font-bold text-neon-text">{item.venueName}</h3>
                <p className="text-sm text-neon-text-muted">{item.region} · {CATEGORY_LABELS[item.category]}</p>
              </>
            ) : null; })()}
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-neon-text-muted/60">실제 업소 사진은 업주 등록 후 표시됩니다</p>
    </div>
  );
}
