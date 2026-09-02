import { AlertCircle } from 'lucide-react';

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 py-4 animate-fade-in">
      <div className="w-2 h-2 rounded-full bg-gold-400/60 animate-breathe" />
      <p className="text-ivory-500 text-sm italic">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="premium-card p-4 border-error/20 animate-fade-in">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="text-error shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-ivory-200 text-sm font-medium">Something went wrong</p>
          <p className="text-ivory-500 text-xs mt-1 leading-relaxed">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn-secondary mt-3 text-xs">
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="premium-card p-6 text-center animate-fade-in">
      <p className="text-ivory-400 text-sm">{message}</p>
    </div>
  );
}
