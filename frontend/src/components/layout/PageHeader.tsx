


import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  action,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-[var(--tg-theme-bg-color)] px-4 py-3 safe-area-pt border-b border-[var(--tg-theme-hint-color)]/10">
      <div className="flex items-center justify-between min-h-[44px]">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={handleBack}
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-[var(--tg-theme-link-color)] active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[var(--tg-theme-text-color)] truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-[var(--tg-theme-hint-color)] truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {action}
        </div>
      </div>
    </header>
  );
};


