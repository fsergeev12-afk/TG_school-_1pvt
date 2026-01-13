import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'active' | 'normal' | 'inactive';
  accentLine?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
  variant = 'normal',
  accentLine = false,
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  const variants = {
    active: 'card-active shadow-card',
    normal: 'card-normal shadow-soft',
    inactive: 'card-inactive shadow-soft',
  };

  return (
    <div
      className={`
        ${variants[variant]}
        rounded-2xl
        ${paddings[padding]}
        ${onClick ? 'cursor-pointer active:opacity-90 transition-opacity' : ''}
        ${accentLine ? 'relative overflow-hidden' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {accentLine && <div className="card-accent-line" />}
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
        <h3 className="font-semibold text-[16px] text-dark">{title}</h3>
        {subtitle && (
          <p className="text-[13px] text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
};




