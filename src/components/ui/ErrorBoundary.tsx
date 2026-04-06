import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  retryCount: number;
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
    // 자동 복구 시도 — 3회까지
    if (this.state.retryCount < 3) {
      setTimeout(() => {
        this.setState(prev => ({ hasError: false, retryCount: prev.retryCount + 1 }));
      }, 500);
    }
  }

  render() {
    if (this.state.hasError && this.state.retryCount >= 3) {
      // 3회 실패 후에만 표시
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
