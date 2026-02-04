import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logError } from '../lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError('ErrorBoundary', error, { componentStack: errorInfo.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center h-64 p-8">
            <p className="text-red-600 font-medium mb-2">Something went wrong</p>
            <p className="text-gray-500 text-sm mb-4">{this.state.error?.message}</p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-[#29564F] text-white rounded-md hover:bg-[#29564F]/90"
            >
              Try Again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
