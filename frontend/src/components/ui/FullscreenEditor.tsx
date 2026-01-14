import React, { useEffect } from 'react';
import { Icons } from './Icons';

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
      // Только блокируем скролл, без position: fixed чтобы не ломать layout
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col animate-slide-in-right" style={{ background: 'linear-gradient(135deg, #E0BBE4 0%, #FFD7BA 100%)' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 safe-area-pt" style={{ background: 'linear-gradient(to bottom, rgba(224, 187, 228, 0.95), rgba(255, 215, 186, 0.95))' }}>
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[var(--purple-main)] active:opacity-70 font-medium"
        >
          <Icons.ArrowLeft className="w-5 h-5" />
          <span>Назад</span>
        </button>
        <h2 className="text-[17px] font-semibold text-dark flex-1 text-center pr-16">
          {title}
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 pb-36">
          {children}
        </div>
      </div>

      {/* Fixed Footer - всегда видимый */}
      {footer && (
        <div className="flex-shrink-0 p-4 bg-white/80 backdrop-blur-soft border-t border-[var(--purple-main)]/10" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          {footer}
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s ease-out forwards;
        }
        .overscroll-contain {
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        .safe-area-pt {
          padding-top: max(16px, env(safe-area-inset-top));
        }
      `}</style>
    </div>
  );
};

