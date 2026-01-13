/**
 * Avatar компонент для Desert Sunset Theme
 */

import React from 'react';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  variant?: 'neutral' | 'accent' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  firstName = 'U', 
  lastName = '', 
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const getInitials = () => {
    const first = firstName?.charAt(0).toUpperCase() || 'U';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return `${first}${last}`;
  };

  const variants = {
    neutral: 'avatar-neutral',
    accent: 'avatar-accent',
    dark: 'avatar-dark',
  };

  const sizes = {
    sm: 'w-8 h-8 text-[13px]',
    md: 'w-10 h-10 text-[15px]',
    lg: 'w-12 h-12 text-[17px]',
    xl: 'w-16 h-16 text-[22px]',
  };

  return (
    <div 
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        rounded-full 
        flex items-center justify-center 
        font-semibold 
        flex-shrink-0
        ${className}
      `}
    >
      {getInitials()}
    </div>
  );
};

