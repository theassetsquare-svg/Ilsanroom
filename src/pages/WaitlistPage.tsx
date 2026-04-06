import { useState, useEffect } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { captureLead, isValidEmail, getWaitlistCount, incrementWaitlist } from '@/lib/growth-engine';

const VIP_BENEFITS = [
  { icon: '🔒', title: '숨겨진 업소 리스트', desc: '일반 사용자에게 비공개인 프리미엄 업소 독점 열람' },
  { icon: '⚡', title: '인기 업소 예약 우선권', desc: '대기줄 없이 바로 입장. VIP 전용 예약 채널' },
  { icon: '📩', title: '시크릿 TOP3 독점 알림', desc: '매주 금요일, VIP만 받는 이번 주 핫플 시크릿 리스트' },
  { icon: '📊', title: '실시간 분위기 업데이트', desc: '지금 이 순간 어디가 핫한지 실시간 확인' },
  { icon: '💰', title: '얼리버드 특별 가격', desc: '선착순 300명 한정 특별 멤버십 가격 적용' },
  { icon: '🎁', title: '얼리버드 전용 혜택', desc: '신규 기능 우선 체험 + VIP 전용 이벤트 초대' },
];

const TESTIMONIALS = [
  { name: 'J****', text: '매주 금요일 시크릿 리스트만 보고 가는데, 한 번도 실패한 적 없음. 진짜 숨겨진 곳들이라 사람도 적당하고 분위기 최고.', role: '강남 직장인' },
  { name: 'M****', text: '예약 우선권 때문에 가입했는데, 주말 레이스 대기 0분. 이것만으로도 VIP 본전 뽑고도 남음.', role: '홍대 단골' },
  { name: 'K****', text: '분위기 업데이트가 리얼타임이라 헛걸음 없음. 친구들한테 추천했더니 다 가입함.', role: '일산 거주' },
];

export default function WaitlistPage() {
  useDocumentMeta(
    'VIP 대기자 등록 — 선착순 300명 평생 혜택',
    '놀쿨 VIP 선착순 300명 모집. 숨겨진 업소 리스트, 예약 우선권, 매주 시크릿 TOP3 알림, 얼리버드 특별 혜택.'
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(187);

  useEffect(() => {
    setCount(getWaitlistCount());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    if (!isValidEmail(email)) { setError('올바른 이메일을 입력해주세요.'); return; }

    setLoading(true);
    await captureLead({ name, email, source: 'waitlist' });
    const newCount = incrementWaitlist();
    setCount(newCount);
    setSubmitted(true);
    setLoading(false);
  };

  const percent = Math.round((count / 300) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Hero */}
      <section className="mb-10 text-center">
        <div className="mb-4 inline-block rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
          선착순 300명 한정
        </div>
        <h1 className="mb-3 text-3xl font-bold md:text-4xl">
          VIP — 남들이 모르는 밤을 먼저 경험하세요
        </h1>
        <p className="text-lg text-neon-muted">
          VIP 전용 숨겨진 업소 + 예약 우선권 + 매주 시크릿 리스트
        </p>
      </section>

      {/* Progress bar */}
      <section className="mx-auto mb-10 max-w-md">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-neon-primary">현재 {count}/300명 등록</span>
          <span className="text-neon-muted">{300 - count}자리 남음</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-neon-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-primary to-purple-600 transition-all duration-1000"
            style={{ width: `${percent}%` }}
          />
        </div>
        {count >= 250 && (
          <p className="mt-2 text-center text-sm font-medium text-red-600">
            마감 임박! 자리가 얼마 남지 않았습니다.
          </p>
        )}
      </section>

      {/* Pricing comparison */}
      <section className="mx-auto mb-10 max-w-md rounded-2xl border-2 border-neon-primary bg-neon-surface p-6 shadow-lg">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-neon-primary">VIP 얼리버드 등록</h2>
          <p className="mt-1 text-sm text-neon-muted">선착순 300명 한정 특별 혜택</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-4 py-3 text-base outline-none focus:border-neon-primary"
            />
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neon-border bg-neon-bg px-4 py-3 text-base outline-none focus:border-neon-primary"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-neon-primary to-purple-600 px-4 py-4 text-lg font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '처리 중...' : 'VIP 자리 확보하기 →'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="mb-2 text-4xl">🎉</div>
            <h2 className="mb-2 text-xl font-bold text-green-700">VIP 등록 완료!</h2>
            <p className="text-sm text-green-600">
              {name}님, {count}번째 VIP로 등록되었습니다. 이메일로 VIP 안내를 보내드립니다.
            </p>
          </div>
        )}

        <p className="mt-3 text-center text-xs text-neon-muted">결제 정보 불필요. 런칭 시 안내 드립니다.</p>
      </section>

      {/* Benefits */}
      <section className="mb-10">
        <h2 className="mb-6 text-center text-2xl font-bold">VIP가 받는 혜택</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {VIP_BENEFITS.map((b) => (
            <div key={b.title} className="rounded-xl border border-neon-border bg-neon-surface p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl">{b.icon}</span>
                <h3 className="font-bold">{b.title}</h3>
              </div>
              <p className="text-sm text-neon-muted">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mb-10">
        <h2 className="mb-6 text-center text-2xl font-bold">VIP 후기</h2>
        <div className="space-y-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-xl border border-neon-border bg-neon-surface p-4">
              <p className="mb-2 leading-relaxed text-neon-muted">"{t.text}"</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold">{t.name}</span>
                <span className="text-neon-muted">· {t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="mb-6 text-center text-2xl font-bold">자주 묻는 질문</h2>
        <div className="space-y-3">
          {[
            { q: '지금 결제해야 하나요?', a: '아닙니다. 이메일만 등록하시면 됩니다. 정식 런칭 시 VIP 전용 안내를 보내드립니다.' },
            { q: '얼리버드 혜택은 뭔가요?', a: '선착순 300명에게만 제공되는 특별 멤버십 혜택입니다. 런칭 시 상세 안내드립니다.' },
            { q: '언제 런칭하나요?', a: 'VIP 300명 모집 완료 후 2주 내 런칭 예정입니다. 등록 순서대로 우선 초대됩니다.' },
          ].map((faq) => (
            <div key={faq.q} className="rounded-xl border border-neon-border bg-neon-surface p-4">
              <h3 className="mb-1 font-bold">{faq.q}</h3>
              <p className="text-sm text-neon-muted">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      {!submitted && (
        <section className="rounded-2xl bg-gradient-to-r from-neon-primary to-purple-700 p-8 text-center text-white">
          <h2 className="mb-2 text-2xl font-bold">지금 VIP 자리를 확보하세요</h2>
          <p className="mb-4 opacity-90">300명 마감 후에는 얼리버드 혜택이 종료됩니다.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="rounded-lg bg-white px-8 py-3 font-bold text-neon-primary transition hover:opacity-90"
          >
            VIP 등록하기 ↑
          </button>
        </section>
      )}
    </div>
  );
}
