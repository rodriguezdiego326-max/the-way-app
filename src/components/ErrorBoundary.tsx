import { Component, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col items-center justify-center px-6">
          <div className="premium-card p-6 max-w-sm text-center animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-error" />
            </div>
            <p className="text-ivory-100 font-medium text-sm mb-2">Something went wrong</p>
            <p className="text-ivory-500 text-xs leading-relaxed">
              {this.state.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="btn-secondary mt-4 text-xs"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
