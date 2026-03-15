'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { venues } from '@/data/venues';

const MARKER_STYLES: Record<string, { color: string; bg: string; text: string; label: string }> = {
  club: { color: '#7c3aed', bg: 'bg-[#7c3aed]', text: 'text-[#7c3aed]', label: 'EDM' },
  night: { color: '#ec4899', bg: 'bg-[#ec4899]', text: 'text-[#ec4899]', label: '댄스홀' },
  lounge: { color: '#06b6d4', bg: 'bg-[#06b6d4]', text: 'text-[#06b6d4]', label: '바' },
  room: { color: '#f59e0b', bg: 'bg-[#f59e0b]', text: 'text-[#f59e0b]', label: '프라이빗' },
  yojeong: { color: '#ef4444', bg: 'bg-[#ef4444]', text: 'text-[#ef4444]', label: '전통' },
  hoppa: { color: '#f472b6', bg: 'bg-[#f472b6]', text: 'text-[#f472b6]', label: '호스트' },
};

function getCategoryHref(category: string, slug: string, region: string) {
  const map: Record<string, string> = {
    club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}`,
  };
  return map[category] || `/${category}/${slug}`;
}

export default function MapPage() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const openVenues = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (categoryFilter !== 'all') list = list.filter((v) => v.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.nameKo.toLowerCase().includes(q) || v.regionKo.includes(q));
    }
    return list;
  }, [categoryFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof openVenues>();
    openVenues.forEach((v) => {
      const key = v.regionKo;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [openVenues]);

  // GPS
  const handleGPS = () => {
    if (!navigator.geolocation) { setGpsStatus('denied'); return; }
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus('granted');
        if (mapInstanceRef.current && (window as any).kakao) {
          const kakao = (window as any).kakao;
          mapInstanceRef.current.setCenter(new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
          mapInstanceRef.current.setLevel(5);
        }
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Kakao Map init
  useEffect(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!kakaoKey || !mapRef.current) return;

    const initMap = () => {
      const kakao = (window as any).kakao;
      if (!kakao?.maps) return;

      kakao.maps.load(() => {
        const container = mapRef.current;
        if (!container) return;
        const map = new kakao.maps.Map(container, {
          center: new kakao.maps.LatLng(37.6585, 126.8320),
          level: 8,
        });
        mapInstanceRef.current = map;
        const zoomControl = new kakao.maps.ZoomControl();
        map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

        // Add markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        openVenues.forEach((v) => {
          if (!v.lat || !v.lng) return;
          const ms = MARKER_STYLES[v.category] || MARKER_STYLES.club;
          const markerImage = new kakao.maps.MarkerImage(
            `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${ms.color.replace('#', '')}`,
            new kakao.maps.Size(21, 34)
          );
          const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(v.lat, v.lng),
            map,
            image: markerImage,
            title: v.nameKo,
          });
          const infoContent = `<div style="padding:8px 12px;font-size:13px;font-family:Pretendard,sans-serif;white-space:nowrap;"><strong>${v.nameKo}</strong><br/><span style="color:#888">${ms.label} · ${v.regionKo}</span></div>`;
          const infowindow = new kakao.maps.InfoWindow({ content: infoContent });
          kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
          kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
          markersRef.current.push(marker);
        });

        // Clustering
        if (kakao.maps.MarkerClusterer) {
          new kakao.maps.MarkerClusterer({
            map,
            markers: markersRef.current,
            gridSize: 60,
            averageCenter: true,
            minLevel: 6,
          });
        }
      });
    };

    if ((window as any).kakao?.maps) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false&libraries=clusterer`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, [openVenues]);

  return (
    <div className="min-h-screen bg-neon-bg">
      {/* 상단 필터 */}
      <div className="border-b border-neon-border bg-neon-surface/80 backdrop-blur-lg sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <h1 className="text-lg font-bold text-neon-text shrink-0">위치 탐색</h1>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름·지역 검색"
                className="rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary w-full sm:w-48"
              />
              <button
                onClick={handleGPS}
                className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  gpsStatus === 'granted'
                    ? 'bg-neon-green/20 text-neon-green'
                    : gpsStatus === 'loading'
                    ? 'bg-neon-gold/20 text-neon-gold animate-pulse'
                    : 'bg-neon-surface-2 text-neon-text-muted hover:text-neon-text'
                }`}
                style={{ minHeight: 40 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
                {gpsStatus === 'granted' ? '내 주변' : gpsStatus === 'loading' ? '탐색중' : 'GPS'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setCategoryFilter('all')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${categoryFilter === 'all' ? 'bg-neon-text text-neon-bg' : 'bg-neon-surface-2 text-neon-text-muted'}`}
                style={{ minHeight: 32 }}>모든 유형</button>
              {Object.entries(MARKER_STYLES).map(([key, s]) => (
                <button key={key} onClick={() => setCategoryFilter(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${categoryFilter === key ? 'text-white' : `bg-neon-surface-2 ${s.text}`}`}
                  style={categoryFilter === key ? { backgroundColor: s.color, minHeight: 32 } : { minHeight: 32 }}>
                  {s.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-neon-text-muted shrink-0">{openVenues.length}개</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        {/* 카카오맵 */}
        <div className="mb-6 rounded-2xl border border-neon-border overflow-hidden" style={{ height: 'min(60vh, 500px)' }}>
          <div ref={mapRef} className="w-full h-full" id="kakao-map">
            {!process.env.NEXT_PUBLIC_KAKAO_JS_KEY && (
              <div className="flex h-full items-center justify-center flex-col gap-3 bg-neon-surface-2">
                <p className="text-neon-text-muted text-sm">카카오맵 연동 대기</p>
                <a href={`https://map.kakao.com/?q=${encodeURIComponent('일산 나이트라이프')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="rounded-lg bg-[#FEE500] px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-[#FDD700]"
                  style={{ minHeight: 40 }}>
                  카카오맵에서 열기
                </a>
                <p className="text-[11px] text-neon-text-muted/50">NEXT_PUBLIC_KAKAO_JS_KEY 설정 후 자동 연동</p>
              </div>
            )}
          </div>
        </div>

        {/* 마커 범례 */}
        <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(MARKER_STYLES).map(([, s]) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-neon-text-muted">{s.label}</span>
            </div>
          ))}
        </div>

        {/* 권역별 목록 */}
        <div className="space-y-6">
          {grouped.map(([region, vList]) => (
            <section key={region}>
              <h2 className="mb-3 text-base font-bold text-neon-text flex items-center gap-2">
                {region}
                <span className="rounded-full bg-neon-surface-2 px-2 py-0.5 text-[11px] text-neon-text-muted">{vList.length}</span>
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {vList.map((v) => {
                  const s = MARKER_STYLES[v.category] || MARKER_STYLES.club;
                  return (
                    <Link key={v.id} href={getCategoryHref(v.category, v.slug, v.region)}
                      className="flex items-center gap-3 rounded-xl border border-neon-border bg-neon-surface px-4 py-3 transition hover:border-neon-primary/40 card-hover"
                      style={{ minHeight: 56 }}>
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neon-text">{v.nameKo}</p>
                        <p className="truncate text-xs text-neon-text-muted">{s.label} · {v.regionKo}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {openVenues.length === 0 && (
          <p className="py-16 text-center text-neon-text-muted">검색 결과가 없습니다</p>
        )}
      </div>
    </div>
  );
}
