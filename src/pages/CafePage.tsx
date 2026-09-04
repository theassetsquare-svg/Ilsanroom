import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { trackEvent, getIncomingUtm } from '@/lib/visitor-tracker';

/**
 * /cafe — 놀쿨 네이버 카페 갈림길 페이지 (2026-09-04).
 * 1관(정보)·2관(소식) 두 카페로 보내는 것만 한다. 위젯·통계 없음.
 * 단추 클릭은 GA4 `cafe_click`(hall + 유입 utm_source/medium/campaign) 으로 센다 — 이동은 막지 않는다.
 */
const HALL1_URL = 'https://cafe.naver.com/qotjsdnr?utm_source=nolcool&utm_medium=cafe_page&utm_campaign=hall1';
const HALL2_URL = 'https://cafe.naver.com/beasunwook?utm_source=nolcool&utm_medium=cafe_page&utm_campaign=hall2';

type Hall = 'hall1' | 'hall2';

/* 단추를 누르면 어느 관을 골랐는지 + 어디서 온 손님인지(위성·유튜브·광고 UTM)를 GA4 로 보낸다.
   preventDefault 없음 → target=_blank 새 창 이동은 그대로. 페이로드는 visitor-tracker 단일 관문(scrubPii) 통과. */
function onCafeClick(hall: Hall) {
  trackEvent('cafe_click', { hall, ...getIncomingUtm() });
}

const rows = [
  { item: '1관', body: '위치·영업시간·주차·복장·가는 길' },
  { item: '2관', body: '이벤트·행사·시간대 팁' },
  { item: '공통', body: '만 19세 이상 · 운영 놀쿨(nolcool.com) · 광고·제휴 문의 카카오톡 besta12' },
];

/* 가입 3단계 — 사진·인물 없는 글자 카드(SVG 숫자 원 + 짧은 문장) */
const steps = [
  { n: 1, title: '카페 선택', body: '처음이면 1관, 다니는 분이면 2관' },
  { n: 2, title: '가입', body: '네이버 로그인 후 만 19세 확인' },
  { n: 3, title: '가입인사 한 줄', body: '지역·관심 업소 한 줄이면 됩니다' },
];

/* 등업 혜택 — 카페 등급 설정값(2026-09-04)과 같은 숫자 */
const levelRows = [
  { level: '새싹', body: '가입 즉시 글·질문' },
  { level: '단골', body: '가입 3일·방문 5·글 1·댓글 5 자동 등업 → 가이드·교통 게시판 글쓰기' },
  { level: '우수·VIP', body: '댓글왕·후기왕 후보' },
];

function StepBadge({ n }: { n: number }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" className="mx-auto mb-3 block">
      <circle cx="22" cy="22" r="20" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
      <text x="22" y="28" textAnchor="middle" fontSize="18" fontWeight="800" fill="#ffffff">{n}</text>
    </svg>
  );
}

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
            onClick={() => onCafeClick('hall1')}
            className="block rounded-2xl bg-white/10 border border-white/15 px-6 py-8 text-center text-white hover:bg-white/20 transition-colors"
          >
            <span className="block text-2xl font-black mb-2">놀쿨 1관 정보</span>
            <span className="block text-base text-white/80">전국 나이트클럽 정보·후기</span>
          </a>
          <a
            href={HALL2_URL}
            target="_blank"
            rel="noopener"
            onClick={() => onCafeClick('hall2')}
            className="block rounded-2xl bg-white/10 border border-white/15 px-6 py-8 text-center text-white hover:bg-white/20 transition-colors"
          >
            <span className="block text-2xl font-black mb-2">놀쿨 2관 소식</span>
            <span className="block text-base text-white/80">전국 나이트 이벤트·소식</span>
          </a>
        </div>

        <h2 className="text-xl font-bold text-white mb-3">가입 3단계</h2>
        <ol className="grid gap-4 sm:grid-cols-3 mb-10 list-none p-0 m-0">
          {steps.map((s) => (
            <li key={s.n} className="rounded-2xl bg-white/5 border border-white/15 px-5 py-6 text-center">
              <StepBadge n={s.n} />
              <span className="block text-lg font-bold text-white mb-1">{s.title}</span>
              <span className="block text-sm text-white/70" style={{ lineHeight: '1.8' }}>{s.body}</span>
            </li>
          ))}
        </ol>

        <h2 className="text-xl font-bold text-white mb-3">등업 혜택</h2>
        <div className="overflow-x-auto mb-10">
          <table className="w-full text-left text-white/85 border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-2 pr-4 w-24 text-white">등급</th>
                <th className="py-2 text-white">할 수 있는 것</th>
              </tr>
            </thead>
            <tbody>
              {levelRows.map((r) => (
                <tr key={r.level} className="border-b border-white/10">
                  <td className="py-3 pr-4 font-bold align-top">{r.level}</td>
                  <td className="py-3" style={{ lineHeight: '1.8' }}>{r.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
