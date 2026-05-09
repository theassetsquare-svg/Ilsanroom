import { useState, useCallback } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { getReferralStats } from '@/lib/growth-engine';

export default function MyReferralsPage() {
  useDocumentMeta(
    '내 추천 링크 — 친구에게 놀쿨 공유',
    '내 추천 링크를 카카오톡·문자·SNS로 공유. 친구가 같은 페이지에서 후기·랭킹·커뮤니티를 그대로 볼 수 있게 도와줍니다. 별도 보상 정책은 운영진 검토 후 안내됩니다.'
  );

  const [copied, setCopied] = useState(false);
  const stats = getReferralStats();
  const referralUrl = `${window.location.origin}/ref/${stats.code}`;

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralUrl]);

  const share = useCallback(() => {
    const message = '놀쿨에서 단골만 아는 후기 보고 가자';
    if (navigator.share) {
      navigator.share({ title: '놀쿨 추천', text: message, url: referralUrl });
    } else {
      navigator.clipboard.writeText(`${message} ${referralUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralUrl]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-center text-3xl font-bold">친구에게 놀쿨 공유</h1>
      <p className="mb-8 text-center text-neon-muted">
        같이 갈 친구한테 링크 한 번 보내봐
      </p>

      <section className="mb-8 rounded-2xl border border-neon-primary/20 bg-neon-surface p-6 text-center">
        <p className="text-sm text-neon-muted">현재 누적 추천</p>
        <p className="mt-1 text-3xl font-bold text-neon-primary">{stats.referredCount}명</p>
        <p className="mt-2 text-xs text-neon-muted">
          별도 보상 정책은 운영진 검토 후 안내됩니다. 검증되지 않은 약속은 표시하지 않습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-bold">내 추천 링크</h2>
        <div className="flex items-stretch gap-2 rounded-xl border border-neon-border bg-neon-bg p-2">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-2 text-sm"
          />
          <button
            onClick={copyLink}
            className="whitespace-nowrap rounded-lg bg-neon-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
          >
            {copied ? '복사됨!' : '복사'}
          </button>
        </div>
        <p className="mt-2 text-xs text-neon-muted">추천 코드: {stats.code}</p>
      </section>

      <section className="mb-8">
        <button
          onClick={share}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neon-primary px-4 py-3 text-base font-bold text-white transition hover:opacity-90"
        >
          <span className="text-xl">📤</span>
          <span>친구에게 공유하기</span>
        </button>
      </section>

      <section>
        <h2 className="mb-4 text-center text-xl font-bold">공유 방법</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { step: '1', title: '링크 복사', desc: '위 추천 링크를 복사' },
            { step: '2', title: '친구에게 전달', desc: '카카오톡·문자·SNS로 전송' },
            { step: '3', title: '함께 사용', desc: '친구도 같은 페이지에서 후기 확인' },
          ].map((s) => (
            <div key={s.step}>
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-neon-primary text-lg font-bold text-white">
                {s.step}
              </div>
              <p className="text-sm font-bold">{s.title}</p>
              <p className="text-xs text-neon-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
