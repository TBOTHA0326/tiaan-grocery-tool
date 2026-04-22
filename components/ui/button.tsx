import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'ghost';
  size?: 'default' | 'compact';
};

const buttonStyles = {
  base: 'inline-flex items-center justify-center gap-2 rounded-2xl border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variant: {
    default: 'bg-accent text-white border-transparent shadow-soft hover:bg-teal-600',
    secondary: 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 border-transparent',
  },
  size: {
    default: 'h-12 px-5 text-sm font-semibold sm:h-11 sm:px-4',
    compact: 'h-10 px-3 text-sm font-medium',
  },
};

export function Button({ className = '', variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button className={`${buttonStyles.base} ${buttonStyles.variant[variant]} ${buttonStyles.size[size]} ${className}`} {...props} />
  );
}
