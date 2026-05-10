import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function WaitlistPage() {
  useDocumentMeta(
    'VIP 대기자 등록 — 준비 중',
    'VIP 멤버십 모집은 단가·혜택이 확정된 뒤 다시 안내드립니다. 그 전까지는 커뮤니티·랭킹에서 자유롭게 정보를 확인하세요.'
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-3 text-3xl font-bold">VIP 멤버십</h1>
      <p className="mb-6 text-base text-neon-muted">
        혜택 구성과 단가가 확정된 뒤 다시 공개됩니다. 검증되지 않은 약속은 표기하지 않습니다.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/community" className="rounded-xl bg-neon-primary px-5 py-3 text-sm font-bold text-white">
          커뮤니티 둘러보기
        </Link>
        <Link to="/ranking" className="rounded-xl border border-neon-border px-5 py-3 text-sm font-bold text-neon-text">
          이번 주 랭킹
        </Link>
      </div>
    </div>
  );
}
