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
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl px-6 py-3 text-sm font-bold transition active:scale-[0.98]"
            style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 48 }}
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
