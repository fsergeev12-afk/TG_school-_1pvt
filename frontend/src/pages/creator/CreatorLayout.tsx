import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CreatorBottomNav } from '../../components/layout';

// Pages
import CoursesPage from './CoursesPage';
import CreateCoursePage from './CreateCoursePage';
import CourseDetailPage from './CourseDetailPage';
import StreamsPage from './StreamsPage';
import StreamDetailPage from './StreamDetailPage';
import PromoCodesPage from './PromoCodesPage';
import ChatsPage from './ChatsPage';
import ChatDetailPage from './ChatDetailPage';
import SettingsPage from './SettingsPage';

// Страницы где скрывать BottomNav
const HIDE_NAV_PATHS = ['/creator/courses/new', '/creator/chats/'];

export default function CreatorLayout() {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATHS.some(path => location.pathname.startsWith(path));

  return (
    <div className={`min-h-screen bg-[var(--tg-theme-bg-color)] ${hideNav ? '' : 'pb-20'}`}>
      <Routes>
        <Route path="/" element={<Navigate to="courses" replace />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/new" element={<CreateCoursePage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="streams" element={<StreamsPage />} />
        <Route path="streams/:id" element={<StreamDetailPage />} />
        <Route path="streams/:streamId/promo-codes" element={<PromoCodesPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="chats/:id" element={<ChatDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
      {!hideNav && <CreatorBottomNav />}
    </div>
  );
}


