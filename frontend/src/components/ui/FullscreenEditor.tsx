import React, { useEffect } from 'react';

interface FullscreenEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Полноэкранный редактор — заменяет Modal для редактирования урока
 * Занимает весь экран, имеет фиксированный footer для кнопки
 */
export const FullscreenEditor: React.FC<FullscreenEditorProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--tg-theme-bg-color)] flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tg-theme-hint-color)]/20 bg-[var(--tg-theme-bg-color)] safe-top">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[var(--tg-theme-button-color)] active:opacity-70"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Назад</span>
        </button>
        <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] flex-1 text-center pr-16">
          {title}
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-behavior-contain">
        <div className="p-4 pb-32">
          {children}
        </div>
      </div>

      {/* Fixed Footer */}
      {footer && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--tg-theme-bg-color)] border-t border-[var(--tg-theme-hint-color)]/20 safe-bottom">
          {footer}
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.25s ease-out;
        }
        .overscroll-behavior-contain {
          overscroll-behavior: contain;
        }
      `}</style>
    </div>
  );
};

