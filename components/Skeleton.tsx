import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * ⏳ Loading Skeleton Component
 */
export function Skeleton({ className = '', lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

/**
 * 📦 Card Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse" />
        <div className="flex-1">
          <Skeleton lines={2} />
        </div>
      </div>
      <Skeleton lines={3} />
    </div>
  );
}

/**
 * 📊 Dashboard Card Skeleton
 */
export function DashboardCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="w-20 h-6 bg-slate-100 rounded-full animate-pulse" />
      </div>
      <Skeleton lines={1} className="mb-2" />
      <div className="w-32 h-10 bg-slate-100 rounded animate-pulse" />
    </div>
  );
}

/**
 * 📋 Table Skeleton
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 border-b border-slate-200">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-slate-100">
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-4 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * 🎭 Full Page Loading
 */
export function FullPageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-slate-500 font-medium">Chargement...</p>
    </div>
  );
}

/**
 * 🔄 Retry Button avec loading
 */
interface RetryButtonProps {
  onRetry: () => Promise<void>;
  label?: string;
}

export function RetryButton({ onRetry, label = 'Réessayer' }: RetryButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      await onRetry();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : <Loader2 size={16} />}
      {label}
    </button>
  );
}