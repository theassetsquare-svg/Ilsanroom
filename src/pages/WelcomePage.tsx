import { useEffect } from 'react';
import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useFoundingMember } from '@/hooks/useFoundingMember';
import { trackEvent } from '@/lib/visitor-tracker';

/* /welcome — OPEN BETA 환영 페이지
   첫 방문자/입소문 들어온 사람한테 "놀쿨이 뭐고 왜 지금 가입해야 하는지" 30초 컷 안내.
   1) 막 오픈 + 창립멤버 100명 카운트다운
   2) 6대 약속 (프라이버시) 핵심 3개
   3) 6종 업소 둘러보기 그리드
   4) 가입 CTA */

const promiseHighlights = [
  { icon: '💬', text: '카톡 공유해도 업소 단어 0%' },
  { icon: '🎭', text: '본명·프로필 사진 절대 사용 X' },
  { icon: '🥷', text: 'Stealth 모드 — 폰 빌려줘도 안전' },
];

const categories = [
  { href: '/clubs', emoji: '🎵', label: '클럽', desc: '강남·홍대·이태원' },
  { href: '/nights', emoji: '🌙', label: '나이트', desc: '전국 부킹 명소' },
  { href: '/lounges', emoji: '🍸', label: '라운지', desc: '조용한 자리' },
  { href: '/rooms', emoji: '🚪', label: '룸', desc: '프리미엄 코스' },
  { href: '/yojeong', emoji: '🏮', label: '요정', desc: '한식 풀코스' },
  { href: '/hoppa', emoji: '🥂', label: '호빠', desc: '여성 전용' },
];

export default function WelcomePage() {
  useDocumentMeta(
    'OPEN BETA — 창립멤버 100명 한정 모집',
    '오픈 직후 첫 100명 창립멤버에게 영구 뱃지를 드립니다. 본명 비노출·Stealth 모드 등 프라이버시 설계로 안심하고 시작하세요.'
  );
  const { remaining, totalCount } = useFoundingMember(null);

  // 초대 링크(utm_source=invite)로 /welcome 을 연 진짜 방문자만 invite_open 1회 발송.
  // 내부 배너 클릭(표식 없음)은 집계 제외 = 정확한 입소문 측정.
  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get('utm_source');
    if (src === 'invite') trackEvent('invite_open', { channel: 'welcome' });
  }, []);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A0A0F] via-[#1F0A2A] to-[#0A0A1F] py-12">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #F59E0B 0%, transparent 40%), radial-gradient(circle at 70% 70%, #EC4899 0%, transparent 40%)' }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          {/* 점멸 OPEN BETA 뱃지 */}
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 backdrop-blur-sm border border-rose-500/30 px-3 py-1 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-300">OPEN BETA</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            놀쿨이 <span style={{ color: '#F59E0B' }}>막 열렸습니다</span>
          </h1>
          <p className="text-base text-white/75 mb-6" style={{ lineHeight: '1.7' }}>
            전국 클럽·나이트·라운지·룸·요정·호빠 한 곳에서.<br />
            카톡 공유해도 업소 단어 0% — 친구한테 보내도 안전.
          </p>

          {/* 창립멤버 카운트 */}
          <div className="inline-flex flex-col items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">⭐ 창립멤버 한정</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">
                {remaining !== null ? remaining : '100'}
              </span>
              <span className="text-sm text-white/70">자리 남음</span>
            </div>
            {totalCount !== null && totalCount > 0 && (
              <span className="text-[10px] text-white/50">{totalCount}명이 먼저 가입했어요</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/login" className="rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-black text-black transition shadow-lg">
              ⭐ 창립멤버 가입하기
            </Link>
            <Link to="/" className="rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm px-6 py-3 text-sm font-bold text-white border border-white/20 transition">
              먼저 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* PROMISES */}
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.15em] mb-2">프라이버시 6대 약속 핵심</p>
        <h2 className="text-xl font-black text-[#111] mb-4">친구한테 추천해도 걱정 없는 이유</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {promiseHighlights.map((p) => (
            <div key={p.text} className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-3">
              <div className="text-2xl mb-1">{p.icon}</div>
              <p className="text-[12px] text-[#333] font-medium leading-snug">{p.text}</p>
            </div>
          ))}
        </div>
        <Link to="/privacy-promise" className="inline-block mt-3 text-[12px] font-bold text-emerald-600 hover:underline">
          6대 약속 전체 보기 →
        </Link>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 border-t border-neutral-100">
        <p className="text-[11px] font-black text-violet-600 uppercase tracking-[0.15em] mb-2">전국 120곳</p>
        <h2 className="text-xl font-black text-[#111] mb-4">6종 업소 — 분위기·라인업 한 눈에</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((c) => (
            <Link
              key={c.href}
              to={c.href}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-3 hover:border-violet-200 hover:bg-violet-50/30 transition group"
            >
              <div className="text-2xl mb-1">{c.emoji}</div>
              <div className="text-sm font-black text-[#111] group-hover:text-violet-600">{c.label}</div>
              <div className="text-[10px] text-[#777] mt-0.5">{c.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 border border-amber-200 p-6 text-center">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-2">⭐ 창립멤버 혜택</p>
          <h3 className="text-lg font-black text-[#111] mb-2">1~100번 영구 뱃지</h3>
          <p className="text-[13px] text-[#444] mb-4" style={{ lineHeight: '1.7' }}>
            놀쿨이 백만 회원 사이트가 된 후에도<br />
            <strong className="text-rose-600">"#7번 창립멤버"</strong> 같은 영구 명예 뱃지가 남습니다.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 px-6 py-3 text-sm font-black text-white transition shadow-md"
          >
            지금 창립멤버로 가입하기 →
          </Link>
        </div>
      </section>
    </div>
  );
}
