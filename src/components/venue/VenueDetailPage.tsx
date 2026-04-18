import { Link } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState, useMemo } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import PageViewTracker from '@/components/venue/PageViewTracker';
import VenueHero from '@/components/venue/VenueHero';
import StickyPhoneBar from '@/components/venue/StickyPhoneBar';
import VenueJsonLd from '@/components/venue/VenueJsonLd';
import VenueDetailTabs from '@/components/venue/VenueDetailTabs';
import VenueGallery from '@/components/venue/VenueGallery';
import Card from '@/components/ui/Card';
import ShareButtons from '@/components/interactive/ShareButtons';
import LiveActivityFeed from '@/components/ui/LiveActivityFeed';
import { MidContentHook } from '@/components/engagement/ReadingEngagement';
import type { Venue } from '@/types';

const VenueSeoContent = lazy(() => import('@/components/venue/VenueSeoContent'));

interface FAQ {
  question: string;
  answer: string;
}

interface VenueDetailPageProps {
  venue: Venue;
  categoryLabel: string;
  categoryPath: string;
  regionKo: string;
  regionPath: string;
  detailPath: string;
  faqs: FAQ[];
  related: Venue[];
  relatedHrefFn: (v: Venue) => string;
  extraContent?: React.ReactNode;
  topContent?: React.ReactNode;
}

// ── 컨텐츠 미리보기 필 ──
const contentPills = [
  { emoji: '\uD83D\uDCF8', label: '\uC0AC\uC9C4', id: 'gallery' },
  { emoji: '\uD83C\uDF78', label: '\uC591\uC8FC\uC815\uBCF4', id: 'tabs' },
  { emoji: '\u2B50', label: '\uB9AC\uBDF0', id: 'tabs' },
  { emoji: '\uD83D\uDCA1', label: '\uAFB8\uD301', id: 'seo' },
  { emoji: '\uD83D\uDCCD', label: '\uC704\uCE58\u00B7\uAD50\uD1B5', id: 'tabs' },
  { emoji: '\uD83D\uDC8E', label: '\uC228\uC740\uC815\uBCF4', id: 'seo' },
];

export default function VenueDetailPage({
  venue,
  categoryLabel,
  categoryPath,
  regionKo,
  regionPath,
  detailPath,
  faqs,
  related,
  relatedHrefFn,
  extraContent,
  topContent,
}: VenueDetailPageProps) {
  // 업소 상세페이지: 전화바와 겹치는 하단 engagement 요소 숨기기
  useEffect(() => {
    document.body.classList.add('venue-detail-page');
    return () => { document.body.classList.remove('venue-detail-page'); };
  }, []);

  // "지금 N명 보는 중" — 365일 매일 다른 수치, 24시간 활발
  const [viewingNow] = useState(() => {
    const now = new Date();
    const hour = now.getHours();
    const hash = venue.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    // 날짜 시드: 매일 다른 값
    const daySeed = now.getFullYear() * 400 + (now.getMonth() + 1) * 32 + now.getDate();
    const dayVar = ((daySeed * 2654435761 + hash) >>> 0) % 5; // 0~4 매일 다른 보정
    // 요일 배율: 금토 피크
    const dow = now.getDay();
    const dowMult = (dow === 5 || dow === 6) ? 1.0 : (dow === 0 || dow === 4) ? 0.85 : 0.75;
    let timeMult: number;
    if (hour >= 22 || hour < 2) timeMult = 1.0;
    else if (hour >= 20) timeMult = 0.9;
    else if (hour >= 17) timeMult = 0.7;
    else if (hour >= 12) timeMult = 0.5;
    else if (hour >= 6) timeMult = 0.45;
    else timeMult = 0.5;
    const base = venue.isPremium ? 8 : 4;
    const raw = base + (hash % 6) + dayVar;
    return Math.max(2, Math.round(raw * timeMult * dowMult) + Math.floor(Math.random() * 3));
  });

  // 비슷한 업소 — 동적 hook text
  const relatedHookText = useMemo(() => {
    const hooks = [
      '여기 다녀온 사람들이 같이 가본 곳',
      '이 업소 좋아하면 여기도 갈만하다',
      '단골들이 번갈아 가는 곳',
    ];
    const hash = venue.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return hooks[hash % hooks.length];
  }, [venue.slug]);

  const nameHasRegion = venue.nameKo.includes(regionKo);
  const breadcrumbItems = [
    { name: '놀쿨', url: '/' },
    { name: categoryLabel, url: categoryPath },
    ...(nameHasRegion ? [] : [{ name: regionKo, url: regionPath }]),
    { name: venue.nameKo, url: detailPath },
  ];

  return (
    <div className="bg-neon-bg">
      <PageViewTracker venueId={venue.id} venueName={venue.nameKo} category={venue.category} region={venue.region} />
      <VenueJsonLd
        venue={venue}
        breadcrumbItems={breadcrumbItems}
        faqItems={faqs}
        reviews={[]}
        detailPath={detailPath}
      />

      {/* ═══ 1. Breadcrumb ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <Breadcrumb items={[
          { label: categoryLabel, href: categoryPath },
          ...(venue.nameKo.includes(regionKo) ? [] : [{ label: regionKo, href: regionPath }]),
          { label: venue.nameKo },
        ]} />
      </section>

      {/* ═══ 2. Hero ═══ */}
      <VenueHero
        name={venue.nameKo}
        staffNickname={venue.staffNickname}
        isPremium={venue.isPremium}
        category={venue.category}
        regionKo={venue.regionKo}
        slug={venue.slug}
      />

      {/* ═══ 3. 지금 보는 중 ═══ */}
      <div className="mx-auto max-w-[1200px] px-4 pt-3 sm:px-6">
        <p className="text-xs text-[#8B5CF6] font-medium">{'\uD83D\uDC40'} 지금 {viewingNow}명이 이 페이지를 보고 있습니다</p>
      </div>

      {/* ═══ 4. 컨텐츠 미리보기 필 ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <span className="shrink-0 text-xs text-neon-text-muted mr-1">{'\u2B07'} 아래에</span>
          {contentPills.map((pill) => (
            <span
              key={pill.label}
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 px-3 py-1 text-xs font-medium text-[#8B5CF6] whitespace-nowrap"
            >
              {pill.emoji} {pill.label}
            </span>
          ))}
        </div>
      </section>

      {/* Top Content — 히어로 바로 아래 */}
      {topContent && (
        <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
          {topContent}
        </section>
      )}

      {/* ═══ 5. Venue Photo Gallery (moved up before tabs) ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
        <VenueGallery slug={venue.slug} name={venue.nameKo} />
      </section>

      {/* ═══ 6. 8-Tab Content ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
        <VenueDetailTabs venue={venue} faqs={faqs} categoryLabel={categoryLabel} />
      </section>

      {/* ═══ 7. Mid-content hook divider ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <MidContentHook seed={venue.slug} variant={3} />
      </section>

      {/* ═══ 8. SEO Content — 모든 업소에 자동 1000자+ 고유 콘텐츠 ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Suspense fallback={null}>
          <VenueSeoContent venue={venue} />
        </Suspense>
      </section>

      {/* Extra Content (e.g. 일산명월관 전용 2000자 SEO) */}
      {extraContent && (
        <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          {extraContent}
        </section>
      )}

      {/* ═══ 9. Share — 바이럴 루프 (읽은 뒤에 공유) ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 pt-2 pb-4 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#F3F0FF] to-white border border-[#E9E5FF] p-4">
          <p className="text-center text-xs font-bold text-[#8B5CF6] mb-2">이 정보 괜찮았다면 — 친구한테 보내기</p>
          <ShareButtons
            title={venue.nameKo}
            description={venue.shortDescription || venue.description.slice(0, 80)}
          />
        </div>
      </section>

      {/* ═══ 10. 첫 방문 가이드 ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Link to="/guide" className="block rounded-2xl border border-neon-gold/30 bg-neon-gold/5 p-5 transition hover:border-neon-gold/50 card-hover">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{'\uD83D\uDCD6'}</span>
            <div>
              <p className="text-sm font-bold text-neon-text">처음 방문이세요?</p>
              <p className="text-xs text-neon-text-muted">복장, 예산, 매너 — 첫 방문 완벽 가이드 보기</p>
            </div>
          </div>
        </Link>
      </section>

      {/* ═══ 11. 비슷한 업소 (hook text 추가) ═══ */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-neon-text">비슷한 업소</h2>
            <p className="text-xs text-neon-text-muted mt-1">{relatedHookText}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.slice(0, 3).map((v) => (
              <Card key={v.id} href={relatedHrefFn(v)}>
                <h3 className="text-base font-bold text-neon-text mb-1">{v.nameKo}</h3>
                {v.staffNickname && <p className="text-xs text-neon-gold">{v.staffNickname}</p>}
                <p className="text-sm text-neon-text-muted">추천</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 12. 숨은 명소 ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Link to="/hidden" className="block rounded-2xl border border-neon-accent/30 bg-neon-accent/5 p-5 transition hover:border-neon-accent/50 card-hover">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{'\uD83D\uDC8E'}</span>
            <div>
              <p className="text-sm font-bold text-neon-text">이 업소 몰랐지? — 매주 숨은 명소 발굴</p>
              <p className="text-xs text-neon-text-muted">다른 데서 안 나오는 숨은 곳들, 여기서만 파냄</p>
            </div>
          </div>
        </Link>
      </section>

      {/* ═══ 13. 다른 업종 보기 + 활동 피드 ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <span className="shrink-0 text-xs text-neon-text-muted">다른 업종</span>
          {[
            { emoji: '🎵', label: '클럽', href: '/clubs' },
            { emoji: '🌙', label: '나이트', href: '/nights' },
            { emoji: '🍸', label: '라운지', href: '/lounges' },
            { emoji: '🚪', label: '룸', href: '/rooms' },
            { emoji: '🏮', label: '요정', href: '/yojeong' },
            { emoji: '🥂', label: '호빠', href: '/hoppa' },
          ].filter(c => c.href !== categoryPath).map(c => (
            <Link key={c.label} to={c.href} className="shrink-0 inline-flex items-center gap-1 rounded-full bg-neon-surface border border-neon-border px-3 py-1.5 text-xs font-medium text-neon-text hover:border-neon-primary/40 transition whitespace-nowrap">
              {c.emoji} {c.label}
            </Link>
          ))}
        </div>
        <LiveActivityFeed maxItems={3} compact category={venue.category} />
      </section>

      {/* ═══ 14. Sticky Phone Bar ═══ */}
      <StickyPhoneBar
        phone={venue.staffPhone}
        staffName={venue.staffNickname}
        venueName={venue.nameKo}
      />
    </div>
  );
}
