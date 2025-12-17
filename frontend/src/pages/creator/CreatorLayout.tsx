import { Routes, Route, Navigate } from 'react-router-dom';
import { CreatorBottomNav } from '../../components/layout';

// Pages
import CoursesPage from './CoursesPage';
import CourseDetailPage from './CourseDetailPage';
import StudentsPage from './StudentsPage';
import ChatsPage from './ChatsPage';
import ChatDetailPage from './ChatDetailPage';
import StatsPage from './StatsPage';

export default function CreatorLayout() {
  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] pb-20">
      <Routes>
        <Route path="/" element={<Navigate to="courses" replace />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="chats/:id" element={<ChatDetailPage />} />
        <Route path="stats" element={<StatsPage />} />
      </Routes>
      <CreatorBottomNav />
    </div>
  );
}

