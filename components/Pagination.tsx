import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function Pagination({ currentPage, totalPages, onPageChange, loading }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
              currentPage === 1
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-50'
            }`}
          >
            1
          </button>
          {start > 2 && <span className="text-slate-400">...</span>}
        </>
      )}

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={loading}
          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
            currentPage === page
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-50'
          }`}
        >
          {loading && currentPage === page ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            page
          )}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-slate-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
              currentPage === totalPages
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-50'
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

/**
 * 🎯 Infinite Scroll Trigger
 */
export function InfiniteScroll({
  onLoadMore,
  loading,
  hasMore,
}: {
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
}) {
  let triggerRef: HTMLDivElement | null = null;

  React.useEffect(() => {
    if (!triggerRef || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(triggerRef);
    return () => observer.disconnect();
  }, [triggerRef, hasMore, loading, onLoadMore]);

  return (
    <div ref={(node) => { triggerRef = node; }} className="py-4 text-center">
      {loading && (
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="animate-spin" size={20} />
          <span>Chargement...</span>
        </div>
      )}
      {!hasMore && !loading && (
        <p className="text-slate-400 text-sm">Fin des résultats</p>
      )}
    </div>
  );
}