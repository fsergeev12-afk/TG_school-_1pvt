


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
    <header className="sticky top-0 z-10 bg-gradient-to-b from-[var(--bg-lavender)] to-[var(--bg-powder)] px-4 py-6 safe-area-pt border-b border-[var(--purple-main)]/10 backdrop-blur-soft">
      <div className="flex items-center justify-between min-h-[48px]">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full text-[var(--purple-main)] active:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-dark truncate">{title}</h1>
            {subtitle && (
              <p className="text-[14px] text-secondary truncate mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-3">
          {action}
        </div>
      </div>
    </header>
  );
};


