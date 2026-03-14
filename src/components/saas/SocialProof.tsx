'use client';

import { useCallback, useEffect, useState } from 'react';

interface SocialProofMessage {
  id: number;
  avatar: string;
  message: string;
  time: string;
}

const MESSAGES: SocialProofMessage[] = [
  {
    id: 1,
    avatar: '강',
    message: '방금 강남에서 3명이 라운지 정보를 조회했습니다',
    time: '방금 전',
  },
  {
    id: 2,
    avatar: '김',
    message: '서울에서 김**님이 프로 플랜에 가입했습니다',
    time: '2분 전',
  },
  {
    id: 3,
    avatar: '이',
    message: '일산에서 이**님이 업소를 등록했습니다',
    time: '5분 전',
  },
  {
    id: 4,
    avatar: '박',
    message: '홍대에서 박**님이 프리미엄 배지를 획득했습니다',
    time: '8분 전',
  },
  {
    id: 5,
    avatar: '정',
    message: '분당에서 정**님이 베이직 플랜에 가입했습니다',
    time: '12분 전',
  },
  {
    id: 6,
    avatar: '최',
    message: '강남에서 최**님이 리뷰를 작성했습니다',
    time: '15분 전',
  },
];

const ROTATE_INTERVAL = 5000;

export default function SocialProof() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [animating, setAnimating] = useState(false);

  const rotateMessage = useCallback(() => {
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % MESSAGES.length);
      setAnimating(false);
    }, 300);
  }, []);

  useEffect(() => {
    if (dismissed) return;

    const interval = setInterval(rotateMessage, ROTATE_INTERVAL);
    return () => clearInterval(interval);
  }, [dismissed, rotateMessage]);

  // Initial slide-in
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  if (dismissed) return null;

  const current = MESSAGES[currentIndex];

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 max-w-sm transition-all duration-500 ${
        visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-xl border border-neon-border bg-neon-surface p-4 shadow-2xl shadow-black/20 transition-all duration-300 ${
          animating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neon-primary/20 text-sm font-bold text-neon-primary">
            {current.avatar}
          </div>

          {/* Message */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-neon-text">{current.message}</p>
            <p className="mt-0.5 text-xs text-neon-text-muted">{current.time}</p>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(() => setDismissed(true), 500);
            }}
            className="shrink-0 rounded-lg p-1 text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
            aria-label="알림 닫기"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-neon-border">
          <div
            className="h-full bg-neon-primary transition-all ease-linear"
            style={{
              animation: `social-proof-progress ${ROTATE_INTERVAL}ms linear infinite`,
            }}
          />
        </div>

        <style jsx>{`
          @keyframes social-proof-progress {
            from {
              width: 0%;
            }
            to {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
