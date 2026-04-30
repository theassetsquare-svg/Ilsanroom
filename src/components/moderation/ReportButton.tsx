import { useState } from 'react';
import { submitReport, type ReportReason, type ReportTargetType } from '@/lib/report-api';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'profanity', label: '욕설/비방' },
  { value: 'spam', label: '광고/스팸' },
  { value: 'false_info', label: '허위 정보' },
  { value: 'inappropriate', label: '부적절한 내용' },
  { value: 'other', label: '기타' },
];

interface Props {
  targetType: ReportTargetType;
  targetId: string;
}

export default function ReportButton({ targetType, targetId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await submitReport({ targetType, targetId, reason, description });
    setResult(res);
    setSubmitting(false);
    if (res.success) {
      setTimeout(() => { setOpen(false); setResult(null); setDescription(''); }, 1500);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-1 rounded-lg transition"
        style={{ color: '#999', minHeight: 28 }}
        aria-label="신고"
      >
        신고
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: '#FFF' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: '#111' }}>신고하기</h3>

            {result?.success ? (
              <div className="text-center py-4">
                <p className="text-sm font-bold" style={{ color: '#22C55E' }}>신고가 접수되었습니다</p>
                <p className="text-xs mt-1" style={{ color: '#999' }}>검토 후 조치하겠습니다</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {REASONS.map(r => (
                    <label
                      key={r.value}
                      className="flex items-center gap-3 rounded-xl p-3 cursor-pointer transition"
                      style={{ backgroundColor: reason === r.value ? '#F5F3FF' : '#F9FAFB', border: reason === r.value ? '1px solid #8B5CF6' : '1px solid transparent' }}
                    >
                      <input
                        type="radio"
                        name="reason"
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-[#8B5CF6]"
                      />
                      <span className="text-sm" style={{ color: '#111' }}>{r.label}</span>
                    </label>
                  ))}
                </div>

                {reason === 'other' && (
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="상세 내용을 입력해주세요"
                    rows={3}
                    className="w-full rounded-xl border px-3 py-2 text-sm mb-4 outline-none resize-none"
                    style={{ borderColor: '#E5E7EB', color: '#111' }}
                  />
                )}

                {result?.error && (
                  <p className="text-xs mb-3" style={{ color: '#EF4444' }}>{result.error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => { setOpen(false); setResult(null); }}
                    className="flex-1 rounded-xl py-3 text-sm font-medium"
                    style={{ backgroundColor: '#F3F4F6', color: '#555', minHeight: 44 }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#EF4444', minHeight: 44 }}
                  >
                    {submitting ? '전송 중...' : '신고하기'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
