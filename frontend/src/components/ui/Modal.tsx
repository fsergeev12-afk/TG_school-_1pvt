import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content - центрируется на всех устройствах */}
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[85vh] bg-[var(--tg-theme-bg-color)] rounded-2xl overflow-hidden shadow-xl animate-modal-appear`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tg-theme-hint-color)]/20">
            <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full text-xl text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)] hover:bg-[var(--tg-theme-secondary-bg-color)] active:scale-95 transition-all"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-60px)]">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes modal-appear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modal-appear {
          animation: modal-appear 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
