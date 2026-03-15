'use client';

import { useState } from 'react';

export default function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: save to Supabase newsletter table
    setDone(true);
    setEmail('');
  };

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-3 text-center text-sm font-medium text-neon-text">주간 소식 받기</p>
      {done ? (
        <p className="text-center text-sm text-neon-green">구독 완료! 감사합니다.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            required
            className="flex-1 rounded-lg border border-neon-border bg-neon-bg px-3 py-2.5 text-sm text-neon-text placeholder-neutral-500 outline-none focus:border-neon-primary"
          />
          <button type="submit" className="shrink-0 rounded-lg bg-neon-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neon-primary-light" style={{ minHeight: 44 }}>
            구독
          </button>
        </form>
      )}
      <p className="mt-2 text-center text-[10px] text-neon-text-muted/50">qotjsdnr123@naver.com 발송 · 언제든 해지</p>
    </div>
  );
}
