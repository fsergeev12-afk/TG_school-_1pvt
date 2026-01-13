import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUnreadCount } from '../../api/hooks';
import { Icons } from '../ui/Icons';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex flex-col items-center justify-center py-2 px-4 relative
        min-h-[60px] min-w-[64px]
        active:opacity-70 transition-colors
        ${isActive 
          ? 'text-[var(--purple-main)]' 
          : 'text-[var(--text-secondary)]'
        }
      `}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-[var(--error)] text-white text-[10px] font-semibold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </NavLink>
  );
};

export const CreatorBottomNav: React.FC = () => {
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 nav-gradient-bg backdrop-blur-soft border-t border-[var(--purple-main)]/10 safe-area-pb z-50">
      <div className="flex justify-around">
        <NavItem to="/creator/courses" icon={<Icons.Book />} label="Проекты" />
        <NavItem to="/creator/streams" icon={<Icons.Users />} label="Потоки" />
        <NavItem to="/creator/chats" icon={<Icons.Chat />} label="Чаты" badge={unreadCount} />
        <NavItem to="/creator/settings" icon={<Icons.Settings />} label="Ещё" />
      </div>
    </nav>
  );
};

export const StudentBottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 nav-gradient-bg backdrop-blur-soft border-t border-[var(--purple-main)]/10 safe-area-pb z-50">
      <div className="flex justify-around">
        <NavItem to="/student" icon={<Icons.Home />} label="Главная" />
        {/* Материалы убраны - доступ только через "Перейти к проекту" */}
      </div>
    </nav>
  );
};


