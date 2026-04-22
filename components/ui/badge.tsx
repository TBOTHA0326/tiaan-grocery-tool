import type { HTMLAttributes } from 'react';

export function Badge({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ${className}`}
      {...props}
    />
  );
}
