
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPopularVenues } from '@/data/venues';

/**
 * VIRAL LOOP — "이번 주 TOP5 변동" share section
 * Weekly ranking with share CTA
 */

function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`,
    night: `/nights/${slug}`,
    lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`,
    yojeong: `/yojeong/${region}/${slug}`,
    hoppa: `/hoppa/${slug}`,
  };
  return pathMap[category] || `/${category}/${slug}`;
}

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

export default function WeeklyTop5Share() {
  const top5 = useMemo(() => getPopularVenues(5), []);

  const handleShare = () => {
    const text = `[놀쿨] 이번 주 TOP5\n${top5.map((v, i) => `${i + 1}. ${v.nameKo}`).join('\n')}\n\n확인하기 👉 https://ilsanroom.pages.dev/ranking`;
    if (navigator.share) {
      navigator.share({ title: '놀쿨 이번 주 TOP5', text, url: 'https://ilsanroom.pages.dev/ranking' }).catch(() => {});
    } else {
      const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent('https://ilsanroom.pages.dev/ranking')}&text=${encodeURIComponent(text)}`;
      window.open(kakaoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="px-4 py-4 max-w-[1200px] mx-auto">
      <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-[#111]">이번 주 TOP 5</h2>
            <p className="text-xs text-[#555] mt-0.5">매주 월요일 업데이트</p>
          </div>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE500] px-3 py-2 text-xs font-bold text-[#3C1E1E] transition-all hover:bg-[#FDD700] active:scale-95"
            style={{ minHeight: 36 }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#3C1E1E">
              <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-.96 3.56c-.08.3.26.54.52.37l4.24-2.82c.5.06 1.01.1 1.54.1 5.52 0 10-3.58 10-7.94S17.52 3 12 3z" />
            </svg>
            친구에게 공유
          </button>
        </div>

        <div className="space-y-2">
          {top5.map((v, i) => (
            <Link
              key={v.id}
              to={getCategoryHref(v.category, v.slug, v.region)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-white p-3 transition-all hover:shadow-md active:scale-[0.98]"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                i === 0 ? 'bg-[#8B5CF6] text-white' :
                i === 1 ? 'bg-violet-100 text-[#8B5CF6]' :
                i === 2 ? 'bg-violet-50 text-[#8B5CF6]' :
                'bg-gray-100 text-gray-500'
              }`}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#111] truncate">{v.nameKo}</p>
                <p className="text-xs text-[#555]">{v.regionKo} · {catLabel[v.category]}</p>
              </div>
              {i < 3 && (
                <span className="text-xs font-bold text-red-500">HOT</span>
              )}
            </Link>
          ))}
        </div>

        <Link
          to="/ranking"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1 text-sm font-bold text-[#8B5CF6] hover:underline"
          style={{ minHeight: 44 }}
        >
          전체 순위 보기 →
        </Link>
      </div>
    </section>
  );
}
