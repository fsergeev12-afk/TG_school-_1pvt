import { Routes, Route, Navigate } from 'react-router-dom';
import { StudentBottomNav } from '../../components/layout';

// Pages
import StudentHomePage from './StudentHomePage';
import LessonsPage from './LessonsPage';
import LessonDetailPage from './LessonDetailPage';
import PaymentPage from './PaymentPage';

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] pb-20">
      <Routes>
        <Route path="/" element={<StudentHomePage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="lessons/:id" element={<LessonDetailPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <StudentBottomNav />
    </div>
  );
}



