import { Link } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

/**
 * 입점 후기 페이지 — 검증 데이터 확보 전까지 비활성화.
 * 사장님 인증·매출 변화 수치는 출처 검증 가능한 실제 사례만 게시한다.
 */
export default function TestimonialsPage() {
  useDocumentMeta(
    '입점 후기 — 사장님 실제 사례',
    '놀쿨 입점 사장님의 실제 후기 페이지. 검증된 사례만 게시하기 위해 데이터 정비 중입니다.'
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-neon-text mb-3">입점 후기</h1>
      <p className="text-sm text-neon-text-muted mb-6 leading-relaxed">
        사장님 인터뷰와 매출 변화 데이터는 출처가 확인된 사례만 공개합니다.
        <br />
        검증 절차가 끝나는 대로 순차적으로 다시 게시합니다.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/pricing"
          className="rounded-full bg-neon-primary px-5 py-2 text-sm font-semibold text-white"
        >
          입점 안내 보기
        </Link>
        <Link
          to="/"
          className="rounded-full border border-neon-border px-5 py-2 text-sm text-neon-text"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
