import { AlertCircle, RefreshCw } from 'lucide-react';

export function TableSkeleton({ rows = 6, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="h-11 bg-slate-50 border-b" />
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-slate-100 animate-pulse rounded"
                style={{ width: j === 1 ? '28%' : `${10 + ((j * 13) % 12)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white">
      <div className="w-12 h-12 rounded-full bg-red-100 mx-auto flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <p className="mt-3 font-medium">Ma'lumot yuklanmadi</p>
      <p className="text-sm text-muted-foreground mt-1">
        {message || 'Tarmoq yoki server xatosi yuz berdi'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-slate-900 text-white text-sm font-medium rounded-md hover:opacity-90"
        >
          <RefreshCw className="w-4 h-4" />
          Qayta urinish
        </button>
      )}
    </div>
  );
}
