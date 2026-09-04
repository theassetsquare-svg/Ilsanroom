import { useDocumentMeta } from '@/hooks/useDocumentMeta';

/**
 * /cafe — 놀쿨 네이버 카페 갈림길 페이지 (2026-09-04).
 * 1관(정보)·2관(소식) 두 카페로 보내는 것만 한다. 위젯·통계 없음.
 */
const HALL1_URL = 'https://cafe.naver.com/qotjsdnr?utm_source=nolcool&utm_medium=cafe_page&utm_campaign=hall1';
const HALL2_URL = 'https://cafe.naver.com/beasunwook?utm_source=nolcool&utm_medium=cafe_page&utm_campaign=hall2';

const rows = [
  { item: '1관', body: '위치·영업시간·주차·복장·가는 길' },
  { item: '2관', body: '이벤트·행사·시간대 팁' },
  { item: '공통', body: '만 19세 이상 · 운영 놀쿨(nolcool.com) · 광고·제휴 문의 카카오톡 besta12' },
];

export default function CafePage() {
  useDocumentMeta(
    '네이버 카페 두 곳 — 1관 정보와 2관 소식, 어디로 갈까',
    '놀쿨 카페는 1관과 2관으로 나뉩니다. 1관은 처음 가는 분을 위한 위치·영업시간·복장 정보, 2관은 다니는 분을 위한 이벤트·행사 소식. 만 19세 이상.',
  );

  return (
    <div className="bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 text-center">놀쿨 카페는 두 곳입니다</h1>
        <p className="text-base text-white/70 mb-10 text-center" style={{ lineHeight: '1.8' }}>
          1관은 처음 가는 분을 위한 정보, 2관은 다니는 분을 위한 소식입니다. 만 19세 이상만 이용합니다.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-12">
          <a
            href={HALL1_URL}
            target="_blank"
            rel="noopener"
            className="block rounded-2xl bg-white/10 border border-white/15 px-6 py-8 text-center text-white hover:bg-white/20 transition-colors"
          >
            <span className="block text-2xl font-black mb-2">놀쿨 1관 정보</span>
            <span className="block text-base text-white/80">전국 나이트클럽 정보·후기</span>
          </a>
          <a
            href={HALL2_URL}
            target="_blank"
            rel="noopener"
            className="block rounded-2xl bg-white/10 border border-white/15 px-6 py-8 text-center text-white hover:bg-white/20 transition-colors"
          >
            <span className="block text-2xl font-black mb-2">놀쿨 2관 소식</span>
            <span className="block text-base text-white/80">전국 나이트 이벤트·소식</span>
          </a>
        </div>

        <h2 className="text-xl font-bold text-white mb-3">어느 카페로 갈지 한눈에</h2>
        <div className="overflow-x-auto mb-10">
          <table className="w-full text-left text-white/85 border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-2 pr-4 w-20 text-white">항목</th>
                <th className="py-2 text-white">내용</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.item} className="border-b border-white/10">
                  <td className="py-3 pr-4 font-bold align-top">{r.item}</td>
                  <td className="py-3" style={{ lineHeight: '1.8' }}>{r.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-white/60 text-center" style={{ lineHeight: '1.8' }}>
          가짜 후기·가짜 회원은 만들지 않습니다. 운영자 글은 놀쿨 이름으로만 올립니다.
        </p>
      </div>
    </div>
  );
}
