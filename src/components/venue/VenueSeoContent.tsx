import type { Venue } from '@/types';
import { splitParagraphs, josa } from '@/lib/text-format';
import {
  MidContentQuiz,
} from '@/components/engagement/ReadingEngagement';

/**
 * 업소 상세 SEO 콘텐츠 — 끝까지 읽게 만드는 구조
 * 시각적 브레이크 + 중간 훅 + 인터랙션 + 완독 보상
 */

const catLabel: Record<string, string> = {
  club: '클럽', night: '나이트', lounge: '라운지',
  room: '룸', yojeong: '요정', hoppa: '호빠',
};

function slugHash(slug: string): number {
  return slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

// 섹션 헤더 — H2 with store name for SEO
function SectionHeader({ emoji, label, venueName }: { emoji: string; label: string; venueName?: string }) {
  const heading = venueName ? `${venueName} ${label}` : label;
  return (
    <div className="flex items-center gap-2 mt-8 mb-3">
      <span className="text-base">{emoji}</span>
      <h2 className="text-sm font-bold text-[#222] tracking-tight">{heading}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-[#ddd] to-transparent" />
    </div>
  );
}

export default function VenueSeoContent({ venue }: { venue: Venue }) {
  const v = venue.nameKo;
  const cat = catLabel[venue.category] || venue.category;
  const region = venue.regionKo;
  const slug = venue.slug;
  const hash = slugHash(slug);

  // [가짜 0] 지어낸 방문기·단골 이야기·담당 칭찬·숨은 팁 틀을 지우고, 가게 자료(venue 칸)에 있는 것만 문장으로 적는다 — 칸이 비면 그 문장도 없다
  // ── 1. 오프닝 ──
  const opening = region && cat ? `${josa(v, '은/는')} ${region}에 있는 ${cat}입니다.` : '';

  // ── 2. 특징 ──
  const featureText = venue.features.length > 0
    ? `놀쿨에 등록된 ${v}의 특징은 ${venue.features.join(', ')}입니다.`
    : '';

  // ── 4. 담당자 ──
  const staffText = venue.staffNickname
    ? `${v} 예약과 안내는 ${josa(venue.staffNickname, '이/가')} 맡고 있습니다.`
    : '';

  // ── 5. 접근성 ──
  const accessParts: string[] = [];
  if (venue.nearbyStation) accessParts.push(`${v}에서 가까운 역은 ${venue.nearbyStation}입니다.`);
  if (venue.parking) accessParts.push(`주차는 ${venue.parking}입니다.`);
  const accessText = accessParts.join(' ');

  // ── 6. 시간대/드레스코드 ──
  const timeParts: string[] = [];
  if (venue.bestTime) timeParts.push(`놀쿨에 등록된 방문 시간대는 ${venue.bestTime}입니다.`);
  if (venue.dressCode) timeParts.push(`복장은 ${venue.dressCode}입니다.`);
  const timeText = timeParts.join(' ');

  // ── 7. 분위기 ──
  const atmText = venue.atmosphere.length > 0
    ? `놀쿨에 등록된 분위기는 ${venue.atmosphere.join(', ')}입니다.`
    : '';

  // ── 투표 질문 (업소별 고유) ──
  const pollQuestions = [
    `${v}, 가볼 의향 있어?`,
    `${region} ${cat} 중에 ${v} 추천할 수 있어?`,
    `${v}, 재방문 의향은?`,
  ];
  const pollQuestion = pollQuestions[hash % pollQuestions.length];

  return (
    <article className="mt-6">
      {/* ── 오프닝 ── */}
      {opening && (
        <p className="text-sm leading-[1.85] text-[#444] mb-4">{opening}</p>
      )}

      {/* 본문 description은 기본정보 탭(VenueDetailTabs)에서 단일 렌더 — 여기서 중복 제거 */}

      {/* ── 분위기/특징 섹션 ── */}
      {featureText && (
        <>
          <SectionHeader emoji="💬" label="분위기·특징" venueName={v} />
          {splitParagraphs(featureText, 280).map((para, i) => (
            <p key={`feat-${i}`} className="text-sm leading-[1.85] text-[#444] mb-4">{para}</p>
          ))}
        </>
      )}

      {/* ── 담당자 ── */}
      {staffText && (
        <p className="text-sm leading-[1.85] text-[#444]">{staffText}</p>
      )}

      {/* ── 양주/룸/부스 정보 ── */}
      {(venue.liquorInfo || venue.roomInfo || venue.boothInfo) && (
        <>
          <SectionHeader emoji="🍸" label="양주·룸 정보" venueName={v} />
          {venue.liquorInfo && <p className="text-sm leading-[1.85] text-[#444] mb-3">{venue.liquorInfo}</p>}
          {venue.roomInfo && <p className="text-sm leading-[1.85] text-[#444] mb-3">{venue.roomInfo}</p>}
          {venue.boothInfo && <p className="text-sm leading-[1.85] text-[#444] mb-3">{venue.boothInfo}</p>}
        </>
      )}

      {/* ── 중간 투표 ── */}
      <MidContentQuiz
        question={pollQuestion}
        options={['있다, 한번 가볼 만하다', '아직 모르겠다, 더 알아봐야지', '없다, 다른 데가 나을듯']}
        seed={slug}
      />

      {/* ── 접근성 ── */}
      {accessText && (
        <>
          <SectionHeader emoji="📍" label="위치·접근성" venueName={v} />
          <p className="text-sm leading-[1.85] text-[#444]">{accessText}</p>
        </>
      )}

      {/* ── 시간대/드레스코드 ── */}
      {timeText && (
        <>
          <SectionHeader emoji="👔" label="복장·시간대" venueName={v} />
          <p className="text-sm leading-[1.85] text-[#444]">{timeText}</p>
        </>
      )}

      {/* ── 분위기 ── */}
      {atmText && (
        <>
          <SectionHeader emoji="🎵" label="무드·분위기" venueName={v} />
          <p className="text-sm leading-[1.85] text-[#444]">{atmText}</p>
        </>
      )}
    </article>
  );
}
