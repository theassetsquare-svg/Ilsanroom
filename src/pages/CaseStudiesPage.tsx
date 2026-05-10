import { Link } from '../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

/**
 * 입점 사례 연구 — 검증 가능한 데이터 확보 전까지 비활성화.
 * 트래픽·매출 변화율 같은 수치는 1차 출처(애드미니/CMS 캡처) 확인 후 게시한다.
 */
export default function CaseStudiesPage() {
  useDocumentMeta(
    '입점 사례 연구 — 데이터 검증 중',
    '입점 후 트래픽·예약 변화 사례 연구 페이지. 출처가 확인된 데이터만 게시하기 위해 정비 중입니다.'
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-neon-text mb-3">입점 사례 연구</h1>
      <p className="text-sm text-neon-text-muted mb-6 leading-relaxed">
        예약 문의 증감, 검색 노출 변화 같은 수치는
        <br />
        1차 데이터(어드민 통계 캡처·사장님 확인서) 검증 후 공개합니다.
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
