'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';

interface ReportButtonProps {
  targetId: string;
  targetType: 'post' | 'comment' | 'review';
  className?: string;
}

const reportReasons = [
  '허위 정보 또는 거짓 리뷰',
  '스팸 또는 광고',
  '욕설 또는 비속어',
  '성적/음란 콘텐츠',
  '개인정보 노출',
  '불법 행위 조장',
  '기타',
];

export default function ReportButton({ targetId, targetType, className = '' }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!reason) return;
    // In production: POST to /api/v1/reports
    console.log('[Report]', { targetId, targetType, reason, detail });
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setReason('');
      setDetail('');
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-xs text-neutral-600 transition hover:text-red-400 ${className}`}
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        신고
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="콘텐츠 신고">
        {submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-neon-text">신고가 접수되었습니다</p>
            <p className="mt-2 text-sm text-neon-text-muted">관리자가 검토 후 조치하겠습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neon-text-muted">신고 사유를 선택해 주세요.</p>
            <div className="space-y-2">
              {reportReasons.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-3 rounded-lg border border-neon-border bg-neon-surface p-3 transition hover:border-neon-primary/40">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-violet-500"
                  />
                  <span className="text-sm text-neon-text">{r}</span>
                </label>
              ))}
            </div>
            {reason === '기타' && (
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="상세 사유를 입력해 주세요"
                className="w-full rounded-lg border border-neon-border bg-neon-surface px-4 py-3 text-sm text-neon-text outline-none focus:border-neon-primary"
                rows={3}
              />
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-neon-border py-2.5 text-sm text-neon-text-muted transition hover:bg-neon-surface-2"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                신고하기
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
