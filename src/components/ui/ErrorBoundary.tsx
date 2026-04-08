import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error.message);
    // 자동 복구 시도 — 2회까지
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
