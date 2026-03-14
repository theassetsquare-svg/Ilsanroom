'use client';

import { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';

export default function ExitIntent() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');

  const handleMouseOut = useCallback((e: MouseEvent) => {
    if (e.clientY < 0) {
      const shown = sessionStorage.getItem('exit_intent_shown');
      if (!shown) {
        sessionStorage.setItem('exit_intent_shown', 'true');
        setShow(true);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseout', handleMouseOut);
    return () => document.removeEventListener('mouseout', handleMouseOut);
  }, [handleMouseOut]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission here
    setShow(false);
  };

  return (
    <Modal open={show} onClose={() => setShow(false)} title="잠깐! 떠나시기 전에...">
      <div className="space-y-4">
        <p className="text-neon-text-muted">
          무료 나이트라이프 가이드를 받아보세요
        </p>

        <div className="rounded-xl bg-neon-surface-2 p-4">
          <p className="text-sm font-medium text-neon-gold">
            프로 플랜 첫 달 50% 할인
          </p>
          <p className="mt-1 text-xs text-neon-text-muted">
            지금 가입하시면 특별 혜택을 드립니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            className="flex-1 rounded-lg border border-neon-border bg-neon-surface px-4 py-2.5 text-sm text-neon-text placeholder:text-neon-text-muted focus:border-neon-primary focus:outline-none focus:ring-1 focus:ring-neon-primary"
            required
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-neon-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neon-primary-light"
          >
            받기
          </button>
        </form>

        <button
          onClick={() => setShow(false)}
          className="w-full text-center text-sm text-neon-text-muted transition-colors hover:text-neon-text"
        >
          괜찮습니다
        </button>
      </div>
    </Modal>
  );
}
