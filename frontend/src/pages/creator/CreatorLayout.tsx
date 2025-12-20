import { Routes, Route, Navigate } from 'react-router-dom';
import { CreatorBottomNav } from '../../components/layout';

// Pages
import CoursesPage from './CoursesPage';
import CourseDetailPage from './CourseDetailPage';
import StreamsPage from './StreamsPage';
import StreamDetailPage from './StreamDetailPage';
import PromoCodesPage from './PromoCodesPage';
import ChatsPage from './ChatsPage';
import ChatDetailPage from './ChatDetailPage';
import SettingsPage from './SettingsPage';

export default function CreatorLayout() {
  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] pb-20">
      <Routes>
        <Route path="/" element={<Navigate to="courses" replace />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="streams" element={<StreamsPage />} />
        <Route path="streams/:id" element={<StreamDetailPage />} />
        <Route path="streams/:streamId/promo-codes" element={<PromoCodesPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="chats/:id" element={<ChatDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
      <CreatorBottomNav />
    </div>
  );
}


