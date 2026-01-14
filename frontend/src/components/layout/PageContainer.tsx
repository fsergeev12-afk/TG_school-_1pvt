/**
 * PageContainer - обертка для страниц с Desert Sunset градиентом
 */

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`min-h-screen bg-desert-sunset ${className}`}>
      {children}
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backButton?: boolean;
  onBack?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  backButton,
  onBack,
}) => {
  return (
    <div className="px-4 pt-4 pb-3">
      {backButton && onBack && (
        <button
          onClick={onBack}
          className="mb-2 text-[var(--purple-main)] active:opacity-70 transition-opacity"
        >
          ← Назад
        </button>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-dark">{title}</h1>
          {subtitle && (
            <p className="text-[15px] text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
    </div>
  );
};

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
}

export const PageContent: React.FC<PageContentProps> = ({
  children,
  className = '',
  withPadding = true,
}) => {
  return (
    <div className={`${withPadding ? 'px-4 pt-5 pb-24' : 'pt-5 pb-24'} ${className}`}>
      {children}
    </div>
  );
};

