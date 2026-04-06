import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-4">
          <p className="text-base font-bold" style={{ color: '#111' }}>페이지를 불러오지 못했습니다</p>
          <p className="text-sm" style={{ color: '#555' }}>브라우저 캐시를 지우고 다시 시도해주세요</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                // 캐시 삭제 후 새로고침
                if ('caches' in window) {
                  caches.keys().then(names => names.forEach(name => caches.delete(name)));
                }
                window.location.reload();
              }}
              className="rounded-xl px-6 py-3 text-sm font-bold transition active:scale-[0.98]"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 48 }}
            >
              새로고침
            </button>
            <a
              href="/"
              className="rounded-xl px-6 py-3 text-sm font-bold transition active:scale-[0.98] flex items-center"
              style={{ backgroundColor: '#F3F4F6', color: '#111', minHeight: 48 }}
            >
              홈으로
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
