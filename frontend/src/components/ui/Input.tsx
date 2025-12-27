import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3.5 rounded-xl
          bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)]
          text-[var(--tg-theme-text-color)]
          text-base
          placeholder:text-[var(--tg-theme-hint-color)]
          border-2 border-transparent
          focus:border-[var(--tg-theme-button-color)] focus:outline-none
          transition-colors duration-200
          min-h-[48px]
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-sm text-[var(--tg-theme-hint-color)]">{hint}</p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3 rounded-xl resize-none
          bg-[var(--tg-theme-secondary-bg-color,#f0f0f0)]
          text-[var(--tg-theme-text-color)]
          placeholder:text-[var(--tg-theme-hint-color)]
          border-2 border-transparent
          focus:border-[var(--tg-theme-button-color)] focus:outline-none
          transition-colors duration-200
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-sm text-[var(--tg-theme-hint-color)]">{hint}</p>
      )}
    </div>
  );
};



