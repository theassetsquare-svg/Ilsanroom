import NcH1 from '@/components/seo/NcH1';
import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

/* 개인정보 보호 안내 — 지금 실제로 동작하는 기능만 적는다(확인 안 된 약속 0) */

const promises = [
  {
    icon: '🎭',
    title: '글과 댓글은 닉네임으로 표시됩니다',
    body: '게시판에는 작성자 닉네임이 보입니다. 카카오로 가입하면 카카오 프로필 이름이 첫 닉네임으로 들어갈 수 있습니다. 본명을 쓰고 있다면 마이페이지에서 닉네임을 바꿔 주세요.',
    proof: '로그인 → 마이페이지 → 닉네임 옆 「수정」',
  },
  {
    icon: '🥷',
    title: 'Stealth 모드 — 탭 제목 가리기',
    body: '켜면 브라우저 탭의 제목과 아이콘이 "📚 메모"로 바뀝니다. 화면 안의 내용은 그대로이니, 화면까지 가리는 기능은 아닙니다.',
    proof: '메뉴 → 프라이버시 → Stealth 모드',
  },
  {
    icon: '🧹',
    title: '시크릿 모드 안내',
    body: '이 기기에 방문 기록을 남기고 싶지 않다면 브라우저의 시크릿 모드(인프라이빗)를 쓰면 됩니다. 처음 방문했을 때 이 안내가 한 번 뜹니다.',
    proof: '브라우저 메뉴 → 새 시크릿 창',
  },
];

export default function PrivacyPromisePage() {
  useDocumentMeta(
    '개인정보 보호 안내 — 지금 동작하는 기능만 적었다',
    '놀쿨에서 지금 실제로 동작하는 개인정보 보호 기능만 정리했습니다. 닉네임 표시, 탭 제목 가리기, 시크릿 모드 안내입니다.'
  );

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A0A0F] via-[#1F0A2A] to-[#0A0A1F] py-14">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #8B5CF6 0%, transparent 45%), radial-gradient(circle at 70% 70%, #EC4899 0%, transparent 45%)' }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-1.5 mb-5">
            <span className="text-emerald-400">🔒</span>
            <span className="text-[12px] text-white/80">개인정보 보호 안내</span>
          </div>
          <NcH1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            개인정보 보호 안내<br />
            <span style={{ color: '#22C55E' }}>지금 동작하는 기능만</span>
          </NcH1>
          <p className="text-base text-white/70" style={{ lineHeight: '1.7' }}>
            지금 실제로 동작하는 기능만 적었습니다.<br />
            수집 항목과 보관 기간은 개인정보처리방침에 있습니다.
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
                    <span className="font-bold text-violet-500">확인 방법: </span>{p.proof}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RECOMMENDATION CTA */}
        <div className="mt-10 rounded-2xl bg-gradient-to-br from-violet-50 via-rose-50 to-amber-50 border border-violet-100 p-6 text-center">
          <p className="text-sm font-bold text-[#111] mb-2">친구에게 보내고 싶다면</p>
          <p className="text-[13px] text-[#555]" style={{ lineHeight: '1.7' }}>
            카톡으로 <strong className="text-violet-600">https://nolcool.com</strong> 을 보내면 됩니다.<br />
            미리보기에는 놀쿨 홈 화면의 제목과 소개 글이 보입니다.
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
