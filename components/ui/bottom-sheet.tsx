import { useEffect } from 'react';
import type { ReactNode } from 'react';

type BottomSheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({ open, title, description, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
      <div className="bottom-sheet w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white p-5 shadow-soft dark:border-slate-700/70 dark:bg-slate-950">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{title}</p>
            {description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p> : null}
          </div>
          <button type="button" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
