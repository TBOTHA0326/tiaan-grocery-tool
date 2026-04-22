import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-soft dark:border-slate-700/60 dark:bg-slate-950 ${className}`} {...props} />
  );
}
