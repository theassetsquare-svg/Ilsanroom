import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

/* 프라이버시 6대 약속 — 친구 추천용 신뢰 페이지
   백만 회원 비전: "놀쿨은 프라이버시 걱정 없어, 이거 봐" 한 마디로 추천 가능 */

const promises = [
  {
    icon: '💬',
    title: '카톡 공유 위장',
    body: '친구 단톡방에 링크 보내도 미리보기엔 "놀쿨 — 오늘 밤 가이드"만. 업소 이름·업종 단어는 공유 미리보기에 절대 노출 X. 단톡방·카톡 미리보기에서 들킬 일 없음.',
    proof: '실제 카톡 미리보기: "놀쿨 — 오늘 밤 가이드 / 전국 실시간"',
  },
  {
    icon: '🎭',
    title: '본명·프로필 사진 절대 사용 X',
    body: '카카오·구글 로그인해도 본명·실제 사진은 절대 사용 X. 자동 생성 닉네임만 노출. 댓글·후기·글에 본명 뜰 일 없음.',
    proof: '예: "강남언니", "주말전사" 같은 자동 닉네임만 사용',
  },
  {
    icon: '🔒',
    title: '신상털림 차단',
    body: '작성자 닉네임 클릭해도 다른 글 모아보기 비공개가 디폴트. 한 사람의 활동을 추적해서 신상 알아내는 행위 원천 차단.',
    proof: '본인이 직접 ON 하지 않으면 다른 사람이 내 글 모아볼 수 없음',
  },
  {
    icon: '🥷',
    title: 'Stealth 모드 (탭 제목 위장)',
    body: '폰 잠깐 빌려줄 때 한 번 토글하면 모든 탭 제목이 "📚 메모"로 위장. 가족·연인·동료가 화면 봐도 안전.',
    proof: '우상단 메뉴에서 "Stealth ON" 토글 — 30초면 켜고 끄기 가능',
  },
  {
    icon: '🧹',
    title: '시크릿 모드 자동 안내',
    body: '첫 방문 시 1회 안내: "가족·연인이 폰 봐도 흔적 안 남게 시크릿/InPrivate 사용 권장." 강요하지 않고 안내만. 흔적 0%로 즐길 수 있는 방법 알려줌.',
    proof: '쿠키·히스토리 안 남는 시크릿 모드 사용법 안내',
  },
  {
    icon: '💳',
    title: '결제·이메일 표기 중립',
    body: '광고 결제 시 카드 명세서 표기명도 중립적 표현. 메일 발송자 이름도 "놀쿨" 외 다른 단어 노출 X. 가족이 명세서·메일함 봐도 들킬 일 없음.',
    proof: '카드 명세서: "NOLCOOL" / 발송자: "놀쿨 알림"',
  },
];

export default function PrivacyPromisePage() {
  useDocumentMeta(
    '프라이버시 6대 약속 — 친구한테 추천해도 안전한 이유',
    '본명 비노출, 신상 보호, Stealth 모드, 시크릿 진입, 결제 명세서 중립 표기까지 — 사용자 프라이버시를 지키는 6대 약속을 정리했습니다.'
  );

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A0A0F] via-[#1F0A2A] to-[#0A0A1F] py-14">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #8B5CF6 0%, transparent 45%), radial-gradient(circle at 70% 70%, #EC4899 0%, transparent 45%)' }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-1.5 mb-5">
            <span className="text-emerald-400">🔒</span>
            <span className="text-[12px] text-white/80">프라이버시 6대 약속</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            친구한테 추천해도<br />
            <span style={{ color: '#22C55E' }}>걱정 없는 이유</span>
          </h1>
          <p className="text-base text-white/70" style={{ lineHeight: '1.7' }}>
            놀쿨은 나이트라이프 사용자가 가장 무서워하는 6가지를 전부 막았다.<br />
            이 약속이 깨지면 사이트 자격 없음.
          </p>
        </div>
      </section>

      {/* PROMISES */}
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-4">
          {promises.map((p, i) => (
            <div key={p.title} className="rounded-2xl border border-[#E5E5EA] bg-white p-5 hover:border-violet-200 transition">
              <div className="flex items-start gap-3">
                <div className="shrink-0 text-3xl">{p.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black text-violet-500">#{String(i + 1).padStart(2, '0')}</span>
                    <h2 className="text-base font-black text-[#111]">{p.title}</h2>
                  </div>
                  <p className="text-sm text-[#444]" style={{ lineHeight: '1.7' }}>{p.body}</p>
                  <p className="mt-2 text-[12px] text-[#777] bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2">
                    <span className="font-bold text-violet-500">증명: </span>{p.proof}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RECOMMENDATION CTA */}
        <div className="mt-10 rounded-2xl bg-gradient-to-br from-violet-50 via-rose-50 to-amber-50 border border-violet-100 p-6 text-center">
          <p className="text-sm font-bold text-[#111] mb-2">친구한테 보내고 싶다면</p>
          <p className="text-[13px] text-[#555]" style={{ lineHeight: '1.7' }}>
            카톡으로 <strong className="text-violet-600">https://nolcool.com</strong> 보내봐.<br />
            미리보기에 "놀쿨 — 오늘 밤 가이드"만 뜬다. 업소·업종 단어 0%.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3 text-[13px]">
          <Link to="/privacy" className="text-[#8B5CF6] hover:text-[#7C3AED] font-bold">개인정보처리방침 →</Link>
          <Link to="/terms" className="text-[#8B5CF6] hover:text-[#7C3AED] font-bold">이용약관 →</Link>
          <Link to="/" className="text-[#8B5CF6] hover:text-[#7C3AED] font-bold">홈으로 →</Link>
        </div>
      </section>
    </div>
  );
}
