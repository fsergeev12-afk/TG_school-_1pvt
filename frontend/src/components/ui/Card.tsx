import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`
        bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)]
        rounded-2xl
        ${paddings[padding]}
        ${onClick ? 'cursor-pointer active:opacity-80 transition-opacity' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
}) => {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-semibold text-[var(--tg-theme-text-color)]">{title}</h3>
        {subtitle && (
          <p className="text-sm text-[var(--tg-theme-hint-color)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
};




