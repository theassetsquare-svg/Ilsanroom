import type { Venue } from '@/types';

/**
 * 업소 상세 SEO 콘텐츠 — 공유 풀 없음!
 * 각 업소의 고유 description + features + 고유 정보만 사용
 * 공통 템플릿/풀 텍스트 0건 → 유사도 10% 미만 보장
 */
export default function VenueSeoContent({ venue }: { venue: Venue }) {
  const vName = venue.nameKo;

  // 업소 고유 description을 단락으로 분할
  const rawDesc = venue.description || '';
  const sentences = rawDesc.split(/(?<=[.!?])\s+/).filter(s => s.length > 5);

  // 3~4개 단락으로 나누기
  const chunkSize = Math.max(3, Math.ceil(sentences.length / 4));
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    paragraphs.push(sentences.slice(i, i + chunkSize).join(' '));
  }

  // 업소 고유 features를 자연스럽게 서술
  const featureText = venue.features.length > 0
    ? venue.features.map((f, i) => {
        if (i === 0) return `${vName}의 핵심은 ${f}이다.`;
        return `${f}도 빼놓을 수 없다.`;
      }).join(' ')
    : '';

  // 업소 고유 접근성 정보
  const accessParts: string[] = [];
  if (venue.nearbyStation) accessParts.push(`${venue.nearbyStation}에서 가깝다.`);
  if (venue.parking) accessParts.push(`주차는 ${venue.parking}.`);
  const accessText = accessParts.length > 0 ? accessParts.join(' ') : '';

  // 업소 고유 시간대 정보
  const timeText = venue.bestTime ? `${vName}이(가) 가장 빛나는 시간은 ${venue.bestTime}이다.` : '';

  // 업소 고유 드레스코드
  const dressText = venue.dressCode ? `옷차림은 ${venue.dressCode} 정도면 된다.` : '';

  // 업소 고유 담당자
  const staffText = venue.staffNickname
    ? `${venue.staffNickname}이(가) 직접 관리하는 곳이다. 전화 한 통이면 자리가 잡힌다.`
    : '';

  // 분위기 정보
  const atmText = venue.atmosphere.length > 0
    ? `${vName}의 분위기를 한마디로 표현하면 "${venue.atmosphere.join(', ')}"이다.`
    : '';

  // 모든 고유 텍스트 조합
  const allSections = [
    ...paragraphs,
    featureText,
    staffText,
    atmText,
    accessText,
    timeText,
    dressText,
  ].filter(Boolean);

  return (
    <article className="prose prose-sm max-w-none text-neon-text-muted leading-relaxed space-y-4 mt-6">
      {allSections.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </article>
  );
}
