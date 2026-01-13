import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = `
    font-semibold rounded-2xl transition-opacity duration-150 
    flex items-center justify-center gap-2
    touch-manipulation select-none
    active:opacity-85 shadow-card
  `;
  
  const variants = {
    primary: 'btn-cta text-white text-[15px]',
    secondary: 'btn-nav text-white text-[13px]',
    danger: 'bg-[var(--error)] text-white active:opacity-85',
    ghost: 'bg-transparent text-[var(--purple-main)] active:bg-black/5 shadow-none',
  };
  
  // Desert Sunset размеры (мобильно-адаптированные)
  const sizes = {
    sm: 'px-4 h-10',       // 40px - мелкие кнопки, back
    md: 'px-5 h-12',       // 48px - вторичные кнопки
    lg: 'px-6 h-14',       // 56px - CTA кнопки
  };
  
  return (
    <button
      type="button"
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};



