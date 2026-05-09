import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function AnalyticsPage() {
  useDocumentMeta('유입 경로부터 전화 건수까지, 분석 리포트', '어디서 들어왔고 뭘 눌렀고 전환 몇 건인지 그래프로. 요일·시간대 트래픽, 클릭률, 평점 추이를 한 화면에서 확인.');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">통계</h1>
        <p className="mt-1 text-sm text-neon-text-muted">
          업소 페이지의 상세 트래픽과 성과를 확인합니다.
        </p>
      </div>

      <div className="rounded-xl border border-neon-border bg-neon-surface p-8 text-center">
        <p className="text-base font-semibold text-neon-text">데이터 연결 준비 중</p>
        <p className="mt-2 text-sm text-neon-text-muted">
          실제 트래픽·검색 노출·전환 지표는 측정 파이프라인이 연결되는 대로 이 화면에 노출됩니다.
        </p>
        <p className="mt-1 text-xs text-neon-text-muted">
          출처가 검증되지 않은 수치는 표시하지 않습니다.
        </p>
      </div>
    </div>
  );
}
