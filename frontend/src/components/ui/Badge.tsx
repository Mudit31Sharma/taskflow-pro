import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'rose' | 'amber' | 'blue' | 'slate' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
  title,
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    blue: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    slate: 'bg-slate-700/50 text-slate-300 border-slate-600/40',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
