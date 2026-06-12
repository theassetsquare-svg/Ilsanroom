import { useState } from 'react';
import { Link } from '@/components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { captureLead, isValidEmail } from '@/lib/growth-engine';

const CATEGORIES = [
  { name: '클럽', href: '/clubs', desc: 'EDM·힙합 중심의 댄스 플로어 중심 업소' },
  { name: '나이트', href: '/nights', desc: '라이브 밴드와 부킹 문화가 있는 사교 댄스홀' },
  { name: '라운지', href: '/lounges', desc: '대화가 묻히지 않는 조용한 무드의 바·라운지' },
  { name: '룸', href: '/rooms', desc: '프라이빗 룸에서 즐기는 모임 공간' },
  { name: '요정', href: '/yojeong', desc: '한정식과 격을 갖춘 전통 접대 공간' },
  { name: '호빠', href: '/hoppa', desc: '여성 손님을 위한 호스트바' },
];

export default function NightlifeGuidePage() {
  useDocumentMeta(
    '서울경기 나이트라이프 — 업종별로 바로 찾는 업소 가이드',
    '서울 경기 나이트라이프 업종별 안내. 클럽 나이트 라운지 룸 요정 호빠 6개 카테고리에서 등록된 업소를 지역별로 바로 확인하세요.'
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    if (!isValidEmail(email)) { setError('올바른 이메일을 입력해주세요.'); return; }

    setLoading(true);
    await captureLead({ name, email, source: 'nightlife-guide' });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">
          서울/경기 나이트라이프 — 업종별로 바로 찾기
        </h1>
        <p className="mb-2 text-lg text-neon-muted">
          클럽·나이트·라운지·룸·요정·호빠 6개 카테고리. 원하는 업종을 골라 등록된 업소를 지역별로 확인하세요.
        </p>
        <p className="text-sm text-neon-muted">
          새 글과 큐레이션 소식을 받고 싶으면 아래에 이메일을 남겨두세요.
        </p>
      </section>

      {/* Lead capture form */}
      {!submitted ? (
        <section className="mx-auto mb-12 max-w-md rounded-2xl border border-neon-primary/20 bg-neon-surface p-6 shadow-lg">
          <h2 className="mb-2 text-center text-xl font-bold">새 글·큐레이션 알림 신청</h2>
          <p className="mb-4 text-center text-sm text-neon-muted">
            이메일을 남겨두시면 새 가이드와 큐레이션이 준비될 때 안내드립니다.
          </p>
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
              className="w-full rounded-lg bg-neon-primary px-4 py-3 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '알림 신청하기'}
            </button>
          </form>
          <p className="mt-3 text-center text-xs text-neon-muted">스팸 없음. 언제든 구독 취소 가능.</p>
        </section>
      ) : (
        <section className="mx-auto mb-12 max-w-md rounded-2xl border border-green-500/20 bg-green-50 p-6 text-center">
          <div className="mb-2 text-4xl">✅</div>
          <h2 className="mb-2 text-xl font-bold text-green-800">신청이 접수되었습니다!</h2>
          <p className="text-sm text-green-700">
            {name}님, 새 글과 큐레이션 소식이 준비되면 이메일로 안내드립니다.
          </p>
        </section>
      )}

      {/* 업종별 카테고리 — 실제 등록 업소로 이동 */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">업종별로 바로 찾기</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={cat.href}
              className="block rounded-xl border border-neon-border bg-neon-surface p-4 transition hover:border-neon-primary"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-neon-primary/10 px-2 py-0.5 text-xs font-medium text-neon-primary">
                  카테고리
                </span>
                <h3 className="font-bold text-neon-primary">{cat.name}</h3>
              </div>
              <p className="text-sm leading-relaxed text-neon-muted">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      {!submitted && (
        <section className="rounded-2xl bg-gradient-to-r from-neon-primary to-purple-700 p-8 text-center text-white">
          <h2 className="mb-2 text-2xl font-bold">새 업소·큐레이션 소식 받기</h2>
          <p className="mb-4 text-sm opacity-90">
            등록 업소는 위 카테고리에서 바로 확인할 수 있습니다. 새 글과 큐레이션 소식을 이메일로 받아보세요.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="rounded-lg bg-white px-6 py-3 font-bold text-neon-primary transition hover:opacity-90"
          >
            알림 신청하러 가기 ↑
          </button>
        </section>
      )}
    </div>
  );
}
