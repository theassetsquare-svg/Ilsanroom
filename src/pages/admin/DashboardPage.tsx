"use client";

import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com'];

export default function DashboardPage() {
  useDocumentMeta('내 매장 현황판, 한 화면에서 확인', '방문자·전화 클릭·찜 추가·후기 작성 수·유입 지역 분포를 한 화면에서 확인. 사장님 전용 매장 현황 대시보드.');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" /></div>;
  if (!user || !isAdmin) return <div className="mx-auto max-w-md px-4 py-20 text-center"><h1 className="text-2xl font-bold text-neon-text mb-4">관리자 전용</h1><p className="text-neon-text-muted mb-6">이 페이지는 관리자만 접근 가능합니다.</p><a target="_blank" rel="noopener noreferrer" href="/login" className="inline-block rounded-xl bg-neon-primary px-6 py-3 text-sm font-bold text-white">로그인</a></div>;

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">업주 대시보드</h1>
        <p className="mt-1 text-sm text-neon-text-muted">안녕하세요, 관리자님</p>

        <div className="mt-8 rounded-2xl border border-neon-border bg-neon-surface p-8 text-center">
          <p className="text-base font-semibold">실시간 운영 데이터는 통합 통계로 이동했습니다</p>
          <p className="mt-2 text-sm text-neon-text-muted">
            회원 수·게시물·후기 등 실제 Supabase 기반 지표는 운영 통계 페이지에서 확인하세요.
          </p>
          <Link
            to="/admin/stats"
            className="mt-6 inline-flex rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-neon-primary-light transition"
          >
            운영 통계 열기
          </Link>
        </div>
      </div>
    </div>
  );
}
