import type { Venue } from '@/types';

/**
 * 업소 상세 SEO 콘텐츠 — 실제 방문자 후기 느낌
 * 각 업소의 고유 데이터를 자연스러운 이야기체로 변환
 * AI 냄새 제거: 패턴화된 표현 금지
 */

const catLabel: Record<string, string> = {
  club: '클럽', night: '나이트', lounge: '라운지',
  room: '룸', yojeong: '요정', hoppa: '호빠',
};

// slug 기반 시드로 일관된 변형 선택
function pickBySlug<T>(slug: string, arr: T[]): T {
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return arr[hash % arr.length];
}

export default function VenueSeoContent({ venue }: { venue: Venue }) {
  const v = venue.nameKo;
  const cat = catLabel[venue.category] || venue.category;
  const region = venue.regionKo;
  const slug = venue.slug;

  const sections: string[] = [];

  // ── 1. 오프닝 (업소별 다른 오프닝 패턴) ──
  const openings = [
    `${v}을(를) 처음 알게 된 건 지인 추천이었다. "${region}쪽에 괜찮은 ${cat} 있다"는 한마디에 가봤는데 그게 시작이었다.`,
    `${region}에서 ${cat}을(를) 찾고 있다면 ${v}은(는) 한번쯤 들어봤을 이름이다. 이미 가본 사람들 사이에서는 입소문이 꽤 퍼져있다.`,
    `솔직히 ${v} 처음 갔을때 기대가 크진 않았다. ${region} ${cat}이(가) 거기서 거기일 거라고 생각했으니까. 근데 틀렸다.`,
    `${v}은(는) ${region}에서 오래된 곳이다. 오래됐다는 건 두 가지 의미가 있다. 하나는 노후했다는 뜻이고, 다른 하나는 그만큼 검증됐다는 뜻이다. 여기는 후자다.`,
    `"${region} ${cat} 어디 가?" 이 질문을 받으면 보통 몇 군데 이름이 나오는데 ${v}은(는) 거기 항상 들어간다.`,
  ];
  sections.push(pickBySlug(slug, openings));

  // ── 2. 본문 (description 활용) ──
  const desc = venue.description || '';
  if (desc.length > 50) {
    // description을 2~3 단락으로 분할하되 자연스럽게
    const sentences = desc.split(/(?<=[.다])\s+/).filter(s => s.length > 10);
    if (sentences.length > 3) {
      const mid = Math.ceil(sentences.length / 2);
      sections.push(sentences.slice(0, mid).join(' '));
      sections.push(sentences.slice(mid).join(' '));
    } else {
      sections.push(desc);
    }
  }

  // ── 3. 분위기/특징 (features 활용, 이야기체) ──
  if (venue.features.length > 0) {
    const featureIntros = [
      `${v}에서 인상적인 부분을 꼽자면`,
      `가보면 몇 가지 눈에 띄는 점이 있다`,
      `다른 곳과 뭐가 다르냐고 물으면`,
    ];
    const intro = pickBySlug(slug + 'f', featureIntros);
    const featureList = venue.features.map((f, i) => {
      if (i === 0) return `${intro}, 우선 ${f}이(가) 있다.`;
      if (i === venue.features.length - 1) return `그리고 ${f}까지. 이 정도면 충분하다.`;
      return `${f}도 있고.`;
    }).join(' ');
    sections.push(featureList);
  }

  // ── 4. 담당자 (있으면) ──
  if (venue.staffNickname) {
    const staffTexts = [
      `여기는 ${venue.staffNickname}이(가) 직접 챙기는 곳이다. 전화 한 통이면 세팅부터 퇴실까지 알아서 다 해준다. 처음이라 뭘 어떻게 해야할지 모르겠으면 그냥 "${venue.staffNickname}한테 전화하세요"가 답이다.`,
      `${venue.staffNickname}이(가) 자리를 잡아주는데 한번 가면 이 분이 왜 단골 관리의 핵심인지 알게 된다. 취향 파악이 빠르고 세팅이 세심하다.`,
      `담당은 ${venue.staffNickname}. 예약부터 퇴실까지 밀착으로 케어해주는 스타일이라 처음 가는 사람도 어색하지 않게 놀 수 있다.`,
    ];
    sections.push(pickBySlug(slug + 's', staffTexts));
  }

  // ── 5. 양주/룸/부스 정보 (있으면) ──
  if (venue.liquorInfo) {
    sections.push(venue.liquorInfo);
  }
  if (venue.roomInfo) {
    sections.push(venue.roomInfo);
  }
  if (venue.boothInfo) {
    sections.push(venue.boothInfo);
  }

  // ── 6. 접근성 ──
  const accessParts: string[] = [];
  if (venue.nearbyStation) accessParts.push(`${venue.nearbyStation}에서 가까워서 찾기 어렵지 않다`);
  if (venue.parking) accessParts.push(`주차는 ${venue.parking}`);
  if (accessParts.length > 0) {
    sections.push(accessParts.join('. ') + '.');
  }

  // ── 7. 시간대/드레스코드 ──
  if (venue.bestTime || venue.dressCode) {
    const parts: string[] = [];
    if (venue.bestTime) parts.push(`분위기가 제일 좋은 시간대는 ${venue.bestTime}`);
    if (venue.dressCode) parts.push(`복장은 ${venue.dressCode} 정도면 된다`);
    sections.push(parts.join('. ') + '.');
  }

  // ── 8. 분위기 ──
  if (venue.atmosphere.length > 0) {
    const atmTexts = [
      `전체적인 분위기를 한마디로 하면 "${venue.atmosphere.join(', ')}". 가보면 이 말이 무슨 뜻인지 안다.`,
      `${v}의 무드는 ${venue.atmosphere.join(', ')} 쪽이다. 호불호가 갈릴 수 있지만 맞는 사람에겐 딱이다.`,
    ];
    sections.push(pickBySlug(slug + 'a', atmTexts));
  }

  // ── 9. 클로징 (업소별 다른 마무리) ──
  const closings = [
    `${region}에서 ${cat}을(를) 찾고 있다면 한번 가보는걸 추천한다. 첫 방문이 좀 긴장되면 미리 전화해서 예약하고 가는게 편하다.`,
    `결론: 기대 이상이었다. ${region} ${cat} 중에서 가성비와 분위기 둘 다 잡은 곳.`,
    `다시 갈 의향이 있냐고 물으면 "이미 다음 예약 잡았다"가 답이다.`,
    `처음이라 걱정되면 전화 한 통 먼저 하고 가라. 그게 제일 편하다.`,
  ];
  sections.push(pickBySlug(slug + 'c', closings));

  return (
    <article className="space-y-5 mt-6">
      {sections.map((text, i) => (
        <p key={i} className="text-sm leading-[1.85] text-[#444]">{text}</p>
      ))}
    </article>
  );
}
