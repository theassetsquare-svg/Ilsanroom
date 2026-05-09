import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

/**
 * 사장님 데모 화면 — 가짜 통계/후기 일괄 제거.
 * 실제 어드민 화면 캡처/짧은 영상이 준비되는 대로 다시 게시한다.
 */
export default function DemoPage() {
  useDocumentMeta(
    '업주 화면 미리보기 — 데모 정비 중',
    '사장님이 보는 어드민 미리보기. 실제 화면 캡처로 교체 작업 중입니다. 입점 안내는 가격 페이지에서 확인하세요.'
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-neon-text mb-3">업주 화면 미리보기</h1>
      <p className="text-sm text-neon-text-muted mb-6 leading-relaxed">
        실제 어드민 화면 캡처와 동일한 데모로 교체 중입니다.
        <br />
        가짜 데이터 대신 실제 환경을 보여드리기 위한 정비 단계입니다.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/pricing"
          className="rounded-full bg-neon-primary px-5 py-2 text-sm font-semibold text-white"
        >
          입점 안내
        </Link>
        <Link
          to="/admin"
          className="rounded-full border border-neon-border px-5 py-2 text-sm text-neon-text"
        >
          관리자 진입
        </Link>
      </div>
    </div>
  );
}
