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
        <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2 text-secondary">
          {label}
        </label>
      )}
      <input
        className={`
          w-full h-12 px-4 rounded-2xl
          bg-white/70 backdrop-blur-soft
          text-dark text-[14px]
          placeholder:text-muted
          border-0
          focus:outline-none focus:ring-2 focus:ring-purple-main/20
          transition-all duration-200
          shadow-soft
          ${error ? 'ring-2 ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[13px]" style={{ color: 'var(--error)' }}>{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-[13px] text-secondary">{hint}</p>
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
        <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2 text-secondary">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3 rounded-2xl resize-none
          bg-white/70 backdrop-blur-soft
          text-dark text-[14px]
          placeholder:text-muted
          border-0
          focus:outline-none focus:ring-2 focus:ring-purple-main/20
          transition-all duration-200
          shadow-soft
          ${error ? 'ring-2 ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[13px]" style={{ color: 'var(--error)' }}>{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-[13px] text-secondary">{hint}</p>
      )}
    </div>
  );
};



