import { useMemo } from 'react';
import { Link } from '../ui/SafeLink';
import { articles as localArticles } from '@/data/magazine-articles';
import type { Venue } from '@/types';

/**
 * venue 상세 → 관련 매거진 자동 추천 (역방향 cross-link, 2026-05-24).
 * 매칭 우선순위:
 *   1. article.venueSlug === venue.slug → 100점 (직접 연결된 가이드)
 *   2. article.content가 /{venue.slug}/ 링크 포함 → 100점 (권역 가이드 본문이 실제로 이 업소를 다룸 = 양방향 확정)
 *   3. article.venueName === venue.nameKo → 90점
 *   4. article.title/excerpt에 venue.nameKo 등장 → 60점
 *   5. article.title/excerpt에 venue.region 한글 키워드 등장 → 20점
 *   6. article.tag 또는 본문에 venue.category 키워드 등장 → 10~15점
 * 최대 3개. 매칭 0이면 렌더 안 함.
 */

const regionKoMap: Record<string, string[]> = {
  gangnam: ['강남'], apgujeong: ['압구정'], cheongdam: ['청담'], hongdae: ['홍대'],
  itaewon: ['이태원'], ilsan: ['일산'], bundang: ['분당'], seongnam: ['성남'],
  suwon: ['수원'], ansan: ['안산'], bucheon: ['부천'], incheon: ['인천'],
  busan: ['부산'], 'busan-haeundae': ['해운대', '부산'], daegu: ['대구'],
  daejeon: ['대전'], gwangju: ['광주'], ulsan: ['울산'], jeju: ['제주'],
  cheonan: ['천안'], cheongju: ['청주'], jeonju: ['전주'], changwon: ['창원'],
  gumi: ['구미'], jangan: ['장안'], jangandong: ['장안동'], sangbong: ['상봉'],
  suyu: ['수유'], sinlim: ['신림'], nowon: ['노원'], geondae: ['건대'],
  paju: ['파주'], uijeongbu: ['의정부'], yongsan: ['용산'], yeongdeungpo: ['영등포'],
  pyeongtaek: ['평택'], gimpo: ['김포'], guri: ['구리'], osan: ['오산'],
  yongin: ['용인'], hwajeong: ['화정'], dapsimni: ['답십리'], doksan: ['독산'],
  gildong: ['길동'], gangseo: ['강서'], indeokvon: ['인덕원'], seosan: ['서산'],
};

const categoryKeywords: Record<string, string[]> = {
  club: ['클럽', 'EDM', '하우스'],
  night: ['나이트'],
  lounge: ['라운지', '바'],
  room: ['룸'],
  yojeong: ['요정', '한정식'],
  hoppa: ['호빠', '호스트'],
};

interface Props {
  venue: Venue;
}

export default function RelatedMagazineForVenue({ venue }: Props) {
  const matched = useMemo(() => {
    const regionWords = regionKoMap[venue.region] || [];
    const catWords = categoryKeywords[venue.category] || [];
    const scored = localArticles.map(a => {
      const text = `${a.title} ${a.excerpt}`;
      let score = 0;
      if (a.venueSlug && a.venueSlug === venue.slug) score += 100;
      if (a.content && a.content.includes(`/${venue.slug}/`)) score += 100;
      if (a.venueName && venue.nameKo && a.venueName === venue.nameKo) score += 90;
      if (venue.nameKo && text.includes(venue.nameKo)) score += 60;
      for (const w of regionWords) if (text.includes(w)) score += 20;
      for (const w of catWords) {
        if ((a.tag || '').includes(w)) score += 15;
        if (text.includes(w)) score += 10;
      }
      return { a, score };
    }).filter(s => s.score > 0);
    scored.sort((x, y) => y.score - x.score);
    return scored.slice(0, 3).map(s => s.a);
  }, [venue.slug, venue.nameKo, venue.region, venue.category]);

  if (matched.length === 0) return null;

  return (
    <section className="pt-6 mt-8 border-t" style={{ borderColor: '#E5E7EB' }}>
      <h2 className="text-lg font-bold mb-1" style={{ color: '#111' }}>{venue.nameKo} 관련 매거진</h2>
      <p className="text-xs mb-4" style={{ color: '#888' }}>현장 가이드·후기·심층 분석</p>
      <div className="space-y-3">
        {matched.map(a => (
          <Link
            key={a.id}
            to={`/magazine/${a.id}`}
            className="block rounded-xl border p-4 transition hover:border-[#8B5CF6]/30 hover:shadow-sm"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: '#F3F0FF', color: '#8B5CF6' }}>{a.tag}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight" style={{ color: '#111' }}>{a.title}</p>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: '#555' }}>{a.excerpt}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
