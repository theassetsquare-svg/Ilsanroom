import { Component, type ReactNode } from 'react';
import { notify } from '@/lib/notify';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  retryCount: number;
}

function DefaultFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-2 text-4xl">⚠️</p>
      <p className="mb-1 text-base font-bold text-gray-800">일시적인 오류가 발생했습니다</p>
      <p className="mb-4 text-sm text-gray-500">잠시 후 다시 시도해 주세요</p>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="rounded-xl bg-[#8B5CF6] px-5 py-2 text-sm font-bold text-white active:scale-95"
        >
          새로고침
        </button>
        <a
          href="/"
          className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-700 active:scale-95"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props) {
    // 라우트 변경 시 에러 상태 자동 리셋
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, retryCount: 0 });
    }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error.message);

    // chunk load 에러 시 페이지 새로고침으로 최신 chunk 로드
    const msg = error.message || '';
    if (msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Loading chunk') ||
        msg.includes('Loading CSS chunk') ||
        msg.includes('error loading dynamically imported module')) {
      window.location.reload();
      return;
    }

    // 자동 복구 실패 임박 시 (2회째) 관리자 알림 1회 발송
    if (this.state.retryCount === 1) {
      notify({
        action: 'contact',
        name: '[자동] 페이지 에러',
        email: 'noreply@nolcool.com',
        message: `URL: ${window.location.href}\nUA: ${navigator.userAgent}\nError: ${msg}\n${error.stack?.slice(0, 800) || ''}`,
      });
    }

    // 기타 에러: 2회까지 자동 복구 시도
    if (this.state.retryCount < 2) {
      setTimeout(() => {
        this.setState(prev => ({ hasError: false, retryCount: prev.retryCount + 1 }));
      }, 500);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, retryCount: 0 });
  };

  render() {
    if (this.state.hasError && this.state.retryCount >= 2) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return <DefaultFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
