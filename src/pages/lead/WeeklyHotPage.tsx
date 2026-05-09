import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function WeeklyHotPage() {
  useDocumentMeta(
    '이번 주 핫플 큐레이션 — 준비 중',
    '커뮤니티 후기와 검색 추이를 종합한 주간 핫플 큐레이션은 데이터 파이프라인이 연결되는 대로 공개됩니다. 그 전까지는 랭킹·커뮤니티에서 이번 주 분위기를 확인하세요.'
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-3 text-3xl font-bold">이번 주 핫플 큐레이션</h1>
      <p className="mb-6 text-base text-neon-muted">
        커뮤니티 후기·검색 추이 데이터를 검증한 뒤 공개합니다. 발송 일정을 미리 약속하지 않습니다.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/ranking" className="rounded-xl bg-neon-primary px-5 py-3 text-sm font-bold text-white">
          이번 주 랭킹 보기
        </Link>
        <Link to="/community" className="rounded-xl border border-neon-border px-5 py-3 text-sm font-bold text-neon-text">
          커뮤니티 둘러보기
        </Link>
      </div>
    </div>
  );
}
