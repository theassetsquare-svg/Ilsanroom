

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { venues, categories } from '@/data/venues';
import type { Venue } from '@/types';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

function getCategoryLabel(key: string): string {
  const cat = categories.find(c => c.key === key);
  return cat ? cat.labelKo : key;
}

function getCategoryPath(venue: Venue): string {
  const pathMap: Record<string, string> = {
    club: '/clubs',
    night: '/nights',
    lounge: '/lounges',
    room: '/rooms',
    yojeong: '/yojeong',
    hoppa: '/hoppa',
  };
  const base = pathMap[venue.category] || '/venues';
  if (venue.category === 'club' || venue.category === 'room' || venue.category === 'yojeong') {
    return `${base}/${venue.region}/${venue.slug}`;
  }
  return `${base}/${venue.slug}`;
}

export default function SearchPage() {
  useDocumentMeta('뭐 찾고 있어? 여기서 바로 검색 | 밤키', '117곳 중에서 지역·카테고리·이름으로 딱 맞는 곳 골라줌.');
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setQuery(q);
  }, []);

  const results = useMemo(() => {
    let filtered = venues.filter(v => v.status !== 'closed_or_unclear');
    if (selectedCategory) {
      filtered = filtered.filter(v => v.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.nameKo.toLowerCase().includes(q) ||
        v.regionKo.toLowerCase().includes(q) ||
        v.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [query, selectedCategory]);

  const popular = ['일산룸', '강남청담클럽', '부산나이트', '호빠', '해운대', '수원', '라운지', '요정'];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[#111]">업소 검색</h1>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#555]" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="업소명, 지역, 카테고리로 검색"
          className="w-full rounded-2xl border border-[#D1D5DB] bg-white py-3.5 pl-12 pr-4 text-base text-[#111] placeholder-[#999] shadow-sm outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20"
          style={{ minHeight: 48 }}
          autoFocus
        />
      </div>

      {!query.trim() && (
        <div className="mb-6 flex flex-wrap gap-2">
          {popular.map(tag => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="rounded-full bg-[#F3F0FF] px-4 py-2 text-sm font-medium text-[#7c3aed] transition hover:bg-[#EDE9FE]"
              style={{ minHeight: 36 }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${!selectedCategory ? 'bg-[#8B5CF6] text-white' : 'bg-[#F5F5F5] text-[#333] hover:bg-[#E5E5E5]'}`}
          style={{ minHeight: 36 }}
        >
          전체
        </button>
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedCategory === cat.key ? 'bg-[#8B5CF6] text-white' : 'bg-[#F5F5F5] text-[#333] hover:bg-[#E5E5E5]'}`}
            style={{ minHeight: 36 }}
          >
            {cat.icon} {cat.labelKo}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm font-medium text-[#555]">
        검색 결과 <span className="text-[#8B5CF6]">{results.length}</span>개
      </p>

      {results.length === 0 ? (
        <div className="rounded-2xl bg-[#F9FAFB] p-8 text-center">
          <p className="mb-2 text-lg font-semibold text-[#111]">결과가 없어요</p>
          <p className="mb-4 text-sm text-[#555]">다른 키워드로 찾아보세요</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['일산룸', '강남청담클럽 레이스', '부산연산동물나이트', '강남호빠 로얄', '일산명월관요정'].map(s => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#7c3aed] shadow-sm transition hover:bg-[#F3F0FF]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map(venue => (
            <Link target="_blank" rel="noopener noreferrer" key={venue.id}
              to={getCategoryPath(venue)}
              className="group flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#8B5CF6] hover:shadow-md"
              style={{ minHeight: 140 }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#8B5CF6] text-xs font-bold text-white">
                  {getCategoryLabel(venue.category).charAt(0)}
                </span>
                <span className="text-xs font-medium text-[#555]">{getCategoryLabel(venue.category)}</span>
              </div>
              <h3 className="mb-1 line-clamp-1 text-sm font-bold text-[#111] group-hover:text-[#7c3aed]">
                {venue.name}
              </h3>
              <p className="mb-2 line-clamp-2 flex-1 text-xs text-[#555]" style={{ lineHeight: 1.7 }}>
                {venue.shortDescription}
              </p>
              <div className="mt-auto flex items-center gap-1 text-xs text-[#8B5CF6]">
                <ArrowRight className="h-3 w-3" />
                <span>상세보기</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
