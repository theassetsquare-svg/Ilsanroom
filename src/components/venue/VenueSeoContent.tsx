import type { Venue } from '@/types';
import {
  MidContentHook,
  ReadCompletionReward,
  ReadFinishCount,
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

function pickBySlug<T>(slug: string, arr: T[]): T {
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return arr[hash % arr.length];
}

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

  // ── 1. 오프닝 ──
  const openings = [
    `${v}을(를) 처음 알게 된 건 지인 추천이었다. "${region}쪽에 괜찮은 ${cat} 있다"는 한마디에 가봤는데 그게 시작이었다.`,
    `${region}에서 ${cat}을(를) 찾고 있다면 ${v}은(는) 한번쯤 들어봤을 이름이다. 이미 가본 사람들 사이에서는 입소문이 꽤 퍼져있다.`,
    `솔직히 ${v} 처음 갔을때 기대가 크진 않았다. ${region} ${cat}이(가) 거기서 거기일 거라고 생각했으니까. 근데 틀렸다.`,
    `${v}은(는) ${region}에서 오래된 곳이다. 오래됐다는 건 두 가지 의미가 있다. 하나는 노후했다는 뜻이고, 다른 하나는 그만큼 검증됐다는 뜻이다. 여기는 후자다.`,
    `"${region} ${cat} 어디 가?" 이 질문을 받으면 보통 몇 군데 이름이 나오는데 ${v}은(는) 거기 항상 들어간다.`,
  ];
  const opening = pickBySlug(slug, openings);

  // ── 2. 본문 (description 활용) ──
  const desc = venue.description || '';
  let descBlocks: string[] = [];
  if (desc.length > 50) {
    const sentences = desc.split(/(?<=[.다])\s+/).filter(s => s.length > 10);
    if (sentences.length > 3) {
      const mid = Math.ceil(sentences.length / 2);
      descBlocks = [sentences.slice(0, mid).join(' '), sentences.slice(mid).join(' ')];
    } else {
      descBlocks = [desc];
    }
  }

  // ── 3. 분위기/특징 ──
  let featureText = '';
  if (venue.features.length > 0) {
    const featureIntros = [
      `${v}에서 인상적인 부분을 꼽자면`,
      `${v}에 가보면 몇 가지 눈에 띄는 점이 있다`,
      `${v}이(가) 다른 곳과 뭐가 다르냐고 물으면`,
    ];
    const intro = pickBySlug(slug + 'f', featureIntros);
    featureText = venue.features.map((f, i) => {
      if (i === 0) return `${intro}, 우선 ${f}이(가) 있다.`;
      if (i === venue.features.length - 1) return `그리고 ${f}까지. 이 정도면 충분하다.`;
      return `${f}도 있고.`;
    }).join(' ');
  }

  // ── 4. 담당자 ──
  let staffText = '';
  if (venue.staffNickname) {
    const staffTexts = [
      `${v}은(는) ${venue.staffNickname}이(가) 직접 챙기는 곳이다. 전화 한 통이면 세팅부터 퇴실까지 알아서 다 해준다. ${v} 처음이라 뭘 어떻게 해야할지 모르겠으면 그냥 "${venue.staffNickname}한테 전화하세요"가 답이다.`,
      `${v}에서 ${venue.staffNickname}이(가) 자리를 잡아주는데 한번 가면 이 분이 왜 단골 관리의 핵심인지 알게 된다. 취향 파악이 빠르고 세팅이 세심하다.`,
      `${v} 담당은 ${venue.staffNickname}. 예약부터 퇴실까지 밀착으로 케어해주는 스타일이라 ${v} 처음 가는 사람도 어색하지 않게 놀 수 있다.`,
    ];
    staffText = pickBySlug(slug + 's', staffTexts);
  }

  // ── 5. 접근성 ──
  const accessParts: string[] = [];
  if (venue.nearbyStation) accessParts.push(`${venue.nearbyStation}에서 가까워서 찾기 어렵지 않다`);
  if (venue.parking) accessParts.push(`주차는 ${venue.parking}`);
  const accessText = accessParts.length > 0 ? accessParts.join('. ') + '.' : '';

  // ── 6. 시간대/드레스코드 ──
  const timeParts: string[] = [];
  if (venue.bestTime) timeParts.push(`분위기가 제일 좋은 시간대는 ${venue.bestTime}`);
  if (venue.dressCode) timeParts.push(`복장은 ${venue.dressCode} 정도면 된다`);
  const timeText = timeParts.length > 0 ? timeParts.join('. ') + '.' : '';

  // ── 7. 분위기 ──
  let atmText = '';
  if (venue.atmosphere.length > 0) {
    const atmTexts = [
      `전체적인 분위기를 한마디로 하면 "${venue.atmosphere.join(', ')}". 가보면 이 말이 무슨 뜻인지 안다.`,
      `${v}의 무드는 ${venue.atmosphere.join(', ')} 쪽이다. 호불호가 갈릴 수 있지만 맞는 사람에겐 딱이다.`,
    ];
    atmText = pickBySlug(slug + 'a', atmTexts);
  }

  // ── 8. 클로징 ──
  const closings = [
    `${region}에서 ${cat}을(를) 찾고 있다면 ${v} 한번 가보는걸 추천한다. 첫 방문이 좀 긴장되면 ${v}에 미리 전화해서 예약하고 가는게 편하다.`,
    `결론: ${v}은(는) 기대 이상이었다. ${region} ${cat} 중에서 가성비와 분위기 둘 다 잡은 곳이 ${v}이다.`,
    `${v} 다시 갈 의향이 있냐고 물으면 "이미 다음 예약 잡았다"가 답이다.`,
    `${v} 처음이라 걱정되면 전화 한 통 먼저 하고 가라. 그게 제일 편하다.`,
  ];
  const closing = pickBySlug(slug + 'c', closings);

  // ── 완독 보상 팁 (업소별 고유) ──
  const hiddenTips = [
    `전화할 때 "놀쿨 보고 왔어요" 하면 대접이 달라진다. 검증된 손님으로 인식되기 때문이다.`,
    `첫 방문이면 전화 예약 시 "처음입니다" 한마디 꼭 해라. 세팅부터 달라진다.`,
    `금요일보다 목요일 밤이 진짜다. 금요일은 사람만 많고 정작 분위기는 목요일이 훨씬 낫다.`,
    `단체보다 2~3명이 제일 좋다. 자리 배정도 좋은 곳으로 받고 케어도 확실히 더 받는다.`,
    `예약 없이 가면 좋은 자리 못 받는다. 당일이라도 꼭 전화하고 가라. 이것만 해도 반은 먹고 들어간다.`,
    `늦게 갈수록 분위기는 좋지만 자리가 없다. 오픈 시간에 맞춰 가서 자리 잡고 분위기 올라오는 걸 즐기는게 고수의 방법이다.`,
  ];
  const hiddenTip = hiddenTips[hash % hiddenTips.length];

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
      <p className="text-sm leading-[1.85] text-[#444]">{opening}</p>

      {/* ── 본문 ── */}
      {descBlocks.length > 0 && (
        <>
          <MidContentHook seed={slug} variant={0} />
          {descBlocks.map((block, i) => (
            <p key={`desc-${i}`} className="text-sm leading-[1.85] text-[#444] mb-4">{block}</p>
          ))}
        </>
      )}

      {/* ── 분위기/특징 섹션 ── */}
      {featureText && (
        <>
          <SectionHeader emoji="💬" label="분위기·특징" venueName={v} />
          <p className="text-sm leading-[1.85] text-[#444]">{featureText}</p>
        </>
      )}

      {/* ── 중간 훅 1 ── */}
      <MidContentHook seed={slug + 'mid1'} variant={1} />

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
          <p className="text-sm leading-[1.85] text-[#444]">{v}의 {accessText}</p>
        </>
      )}

      {/* ── 중간 훅 2 ── */}
      <MidContentHook seed={slug + 'mid2'} variant={3} />

      {/* ── 시간대/드레스코드 ── */}
      {timeText && (
        <>
          <SectionHeader emoji="👔" label="복장·시간대" venueName={v} />
          <p className="text-sm leading-[1.85] text-[#444]">{v} 방문 시 {timeText}</p>
        </>
      )}

      {/* ── 분위기 ── */}
      {atmText && (
        <>
          <SectionHeader emoji="🎵" label="무드·분위기" venueName={v} />
          <p className="text-sm leading-[1.85] text-[#444]">{atmText}</p>
        </>
      )}

      {/* ── 총정리 H2 ── */}
      <SectionHeader emoji="📝" label="총정리" venueName={v} />

      {/* ── 클로징 ── */}
      <MidContentHook seed={slug + 'close'} variant={5} />
      <p className="text-sm leading-[1.85] text-[#444]">{closing}</p>

      {/* ── 완독 보상 (스크롤 시 IntersectionObserver로 공개) ── */}
      <ReadCompletionReward
        teaser={`${v} — 끝까지 읽은 사람만 보는 숨겨진 팁`}
        readerCount={200 + (hash % 300)}
      >
        <p className="text-sm leading-[1.85] text-[#444] font-medium">
          {hiddenTip}
        </p>
      </ReadCompletionReward>

      {/* ── 완독자 카운터 ── */}
      <div className="mt-4 text-center">
        <ReadFinishCount pageName={v} baseCount={120 + (hash % 180)} />
      </div>
    </article>
  );
}
