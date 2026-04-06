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
    // 자동 새로고침 (무한루프 방지: 3초 내 재발생 시 중단)
    const lastReload = sessionStorage.getItem('error_reload');
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 3000) {
      sessionStorage.setItem('error_reload', String(now));
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
