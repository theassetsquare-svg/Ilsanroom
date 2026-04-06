import { useState, useCallback } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { getOrCreateReferralCode, getReferralStats } from '@/lib/growth-engine';

const SHARE_TEMPLATES = [
  { platform: '카카오톡', icon: '💬', color: 'bg-yellow-400 text-yellow-900', message: '나만 아는 비밀 업소 리스트 — 너도 볼래? 무료 체험 →' },
  { platform: '문자/SMS', icon: '📱', color: 'bg-green-500 text-white', message: '나이트라이프 추천 앱 발견! 숨겨진 업소 리스트가 대박. 무료 체험 해봐 →' },
  { platform: '링크 복사', icon: '🔗', color: 'bg-neon-primary text-white', message: '' },
];

const REWARD_TIERS = [
  { friends: 1, reward: '이번 달 VIP 무료', icon: '🎁', active: false },
  { friends: 3, reward: 'VIP 평생 무료', icon: '👑', active: false },
  { friends: 5, reward: 'VIP 평생 무료 + 프리미엄 배지', icon: '💎', active: false },
];

export default function MyReferralsPage() {
  useDocumentMeta(
    '내 추천 현황 — 친구 초대 보상',
    '친구를 초대하고 VIP 혜택을 무료로 받으세요. 1명 초대하면 이번 달 무료, 3명이면 평생 무료.'
  );

  const [copied, setCopied] = useState(false);
  const stats = getReferralStats();
  const referralUrl = `${window.location.origin}/ref/${stats.code}`;

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralUrl]);

  const shareVia = useCallback((message: string) => {
    const fullText = `${message} ${referralUrl}`;
    if (navigator.share) {
      navigator.share({ title: '놀쿨 추천', text: message, url: referralUrl });
    } else {
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralUrl]);

  const updatedTiers = REWARD_TIERS.map((t) => ({
    ...t,
    active: stats.referredCount >= t.friends,
  }));

  const nextTier = updatedTiers.find((t) => !t.active);
  const friendsToNext = nextTier ? nextTier.friends - stats.referredCount : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-center text-3xl font-bold">친구 초대 보상</h1>
      <p className="mb-8 text-center text-neon-muted">
        친구를 초대할수록 VIP 혜택이 커집니다
      </p>

      {/* Stats card */}
      <section className="mb-8 rounded-2xl border border-neon-primary/20 bg-neon-surface p-6">
        <div className="mb-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-neon-primary">{stats.referredCount}명</p>
            <p className="text-sm text-neon-muted">추천 친구</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-neon-primary">
              {stats.referredCount >= 3 ? '평생' : `${stats.vipFreeMonths}개월`}
            </p>
            <p className="text-sm text-neon-muted">VIP 무료</p>
          </div>
        </div>

        {nextTier && (
          <div className="rounded-lg bg-neon-primary/5 p-3 text-center">
            <p className="text-sm">
              <span className="font-bold text-neon-primary">{friendsToNext}명</span> 더 초대하면{' '}
              <span className="font-bold">{nextTier.reward}</span>!
            </p>
          </div>
        )}
      </section>

      {/* Referral link */}
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

      {/* Share buttons */}
      <section className="mb-8">
        <h2 className="mb-3 font-bold">공유하기</h2>
        <div className="space-y-2">
          {SHARE_TEMPLATES.map((t) => (
            <button
              key={t.platform}
              onClick={() => t.message ? shareVia(t.message) : copyLink()}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition hover:opacity-90 ${t.color}`}
            >
              <span className="text-xl">{t.icon}</span>
              <span>{t.platform}으로 공유</span>
            </button>
          ))}
        </div>
      </section>

      {/* Reward tiers */}
      <section className="mb-8">
        <h2 className="mb-3 font-bold">보상 단계</h2>
        <div className="space-y-3">
          {updatedTiers.map((tier) => (
            <div
              key={tier.friends}
              className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                tier.active
                  ? 'border-green-500/30 bg-green-50'
                  : 'border-neon-border bg-neon-surface'
              }`}
            >
              <span className="text-2xl">{tier.icon}</span>
              <div className="flex-1">
                <p className="font-bold">
                  친구 {tier.friends}명 초대
                  {tier.active && <span className="ml-2 text-green-600">✓ 달성</span>}
                </p>
                <p className="text-sm text-neon-muted">{tier.reward}</p>
              </div>
              {!tier.active && (
                <div className="text-right text-sm text-neon-muted">
                  {Math.max(0, tier.friends - stats.referredCount)}명 남음
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Share triggers */}
      <section className="mb-8 rounded-2xl bg-gradient-to-r from-neon-primary to-purple-700 p-6 text-white">
        <h2 className="mb-4 text-xl font-bold">공유할 거리가 많아요</h2>
        <div className="space-y-3">
          {[
            { trigger: 'VS 투표 결과', example: '"나는 클럽 레이스 골랐다! 너는?" → 친구에게 공유' },
            { trigger: '퀴즈 결과', example: '"나는 라운지 타입이래!" → SNS에 공유' },
            { trigger: '숨겨진 업소 발견', example: '"이 곳 처음 봤다! 완전 숨겨진 곳" → 친구에게 추천' },
          ].map((item) => (
            <div key={item.trigger} className="rounded-lg bg-white/10 p-3">
              <p className="font-medium">{item.trigger}</p>
              <p className="text-sm opacity-80">{item.example}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-4 text-center text-xl font-bold">추천 방법</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { step: '1', title: '링크 공유', desc: '위 링크를 친구에게 전송' },
            { step: '2', title: '친구 가입', desc: '친구가 링크로 가입 완료' },
            { step: '3', title: '보상 지급', desc: 'VIP 무료 혜택 자동 적용' },
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
