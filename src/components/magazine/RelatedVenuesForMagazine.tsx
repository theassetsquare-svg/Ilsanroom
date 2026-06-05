import { useMemo } from 'react';
import { Link } from '../ui/SafeLink';
import type { Venue } from '@/types';
import { venues as allVenues } from '@/data/venues';

/**
 * 매거진 글 → 관련 venue 자동 추천 (cross-link).
 * 매칭 우선순위:
 *   1. article.title/excerpt에 venue.nameKo 직접 등장 (정확 일치)
 *   2. article.title/excerpt에 venue 지역 한글 키워드 등장 (지역 매칭)
 *   3. article.tag와 venue.category 키워드 매칭
 * 최대 5개. 매칭 0이면 렌더 안 함.
 */

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };

const regionKoMap: Record<string, string[]> = {
  gangnam: ['강남'],
  apgujeong: ['압구정'],
  cheongdam: ['청담'],
  hongdae: ['홍대'],
  itaewon: ['이태원'],
  ilsan: ['일산'],
  bundang: ['분당'],
  seongnam: ['성남'],
  suwon: ['수원'],
  ansan: ['안산'],
  bucheon: ['부천'],
  incheon: ['인천'],
  busan: ['부산'],
  'busan-haeundae': ['해운대', '부산'],
  daegu: ['대구'],
  daejeon: ['대전'],
  gwangju: ['광주'],
  ulsan: ['울산'],
  jeju: ['제주'],
  cheonan: ['천안'],
  cheongju: ['청주'],
  jeonju: ['전주'],
  changwon: ['창원'],
  gumi: ['구미'],
  jangan: ['장안'],
  jangandong: ['장안동'],
  sangbong: ['상봉'],
  suyu: ['수유'],
  sinlim: ['신림'],
  nowon: ['노원'],
  geondae: ['건대'],
  paju: ['파주'],
  uijeongbu: ['의정부'],
  yongsan: ['용산'],
  yeongdeungpo: ['영등포'],
  pyeongtaek: ['평택'],
  gimpo: ['김포'],
  guri: ['구리'],
  osan: ['오산'],
  yongin: ['용인'],
  hwajeong: ['화정'],
  dapsimni: ['답십리'],
  doksan: ['독산'],
  gildong: ['길동'],
  gangseo: ['강서'],
  indeokvon: ['인덕원'],
  seosan: ['서산'],
};

const categoryKeywords: Record<string, string[]> = {
  club: ['클럽', 'EDM', '하우스', '강남클럽'],
  night: ['나이트', '나이트클럽', '돔'],
  lounge: ['라운지', '바'],
  room: ['룸'],
  yojeong: ['요정', '한정식'],
  hoppa: ['호빠', '호스트'],
};

function getHref(v: Venue): string {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`,
    night: `/nights/${v.slug}`,
    lounge: `/lounges/${v.slug}`,
    room: `/rooms/${v.region}/${v.slug}`,
    yojeong: `/yojeong/${v.region}/${v.slug}`,
    hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

interface Props {
  articleTitle: string;
  articleExcerpt?: string;
  articleTag?: string;
}

export default function RelatedVenuesForMagazine({ articleTitle, articleExcerpt = '', articleTag = '' }: Props) {
  const matched = useMemo((): Venue[] => {
    const text = `${articleTitle} ${articleExcerpt}`;
    const active = allVenues.filter(v => v.status !== 'closed_or_unclear');
    const scored: { v: Venue; score: number }[] = [];

    for (const v of active) {
      let score = 0;
      /* ① 가게 이름 직접 등장 — 최우선 */
      if (v.nameKo && text.includes(v.nameKo)) score += 100;
      /* ② 지역 한글 키워드 매칭 */
      const regionWords = regionKoMap[v.region] || [];
      for (const w of regionWords) if (text.includes(w)) score += 20;
      /* ③ 카테고리 키워드 매칭 (article.tag + title) */
      const catWords = categoryKeywords[v.category] || [];
      for (const w of catWords) {
        if (articleTag.includes(w)) score += 15;
        if (text.includes(w)) score += 10;
      }
      /* ④ 프리미엄 가산점 */
      if (v.isPremium) score += 3;
      if (score > 0) scored.push({ v, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map(s => s.v);
  }, [articleTitle, articleExcerpt, articleTag]);

  if (matched.length === 0) return null;

  return (
    <section className="pt-6 mt-8 border-t" style={{ borderColor: '#E5E7EB' }}>
      <h2 className="text-lg font-bold mb-1" style={{ color: '#111' }}>이 글과 어울리는 업소</h2>
      <p className="text-xs mb-4" style={{ color: '#888' }}>본문 키워드와 맞춰 자동 추천</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {matched.map(v => (
          <Link
            key={v.id}
            to={getHref(v)}
            className="rounded-xl border p-3 transition hover:shadow-md hover:border-[#8B5CF6]/30"
            style={{ borderColor: '#E5E7EB', backgroundColor: '#FFF', minHeight: 88 }}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs">{catEmoji[v.category]}</span>
              <span className="text-[10px] font-medium" style={{ color: '#8B5CF6' }}>{catLabel[v.category]}</span>
            </div>
            <p className="text-sm font-bold leading-tight" style={{ color: '#111' }}>{v.nameKo}</p>
            <p className="text-xs mt-1 truncate" style={{ color: '#888' }}>
              {v.regionKo || (regionKoMap[v.region]?.[0] ?? v.region)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
