import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  action,
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 bg-[var(--tg-theme-bg-color)] px-4 py-3 safe-area-pt">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-[var(--tg-theme-link-color)]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">{title}</h1>
            {subtitle && (
              <p className="text-sm text-[var(--tg-theme-hint-color)]">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
};

