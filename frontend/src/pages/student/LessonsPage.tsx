import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/ui';
import { useStudentCourse } from '../../api/hooks';
import { TELEGRAM_BOT_USERNAME } from '../../config';

// Модалка "Материал откроется..."
interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledAt: string | null;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, scheduledAt }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-[var(--tg-theme-bg-color)] rounded-2xl p-6 max-w-sm w-full text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-4xl mb-4">⏳</div>
        <h3 className="font-semibold text-lg text-[var(--tg-theme-text-color)] mb-2">
          Материал откроется
        </h3>
        <p className="text-[var(--tg-theme-text-color)] mb-4">
          {scheduledAt}
        </p>
        <p className="text-sm text-[var(--tg-theme-hint-color)] mb-4">
          Вы получите уведомление в Telegram
        </p>
        <Button fullWidth onClick={onClose}>
          Понятно
        </Button>
      </div>
    </div>
  );
};

export default function LessonsPage() {
  const navigate = useNavigate();
  const { data: course, isLoading } = useStudentCourse();
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [scheduleModal, setScheduleModal] = useState<{ isOpen: boolean; scheduledAt: string | null }>({
    isOpen: false,
    scheduledAt: null,
  });

  // Раскрыть первый блок по умолчанию при загрузке
  useState(() => {
    if (course?.blocks?.[0]) {
      setExpandedBlocks({ [course.blocks[0].id]: true });
    }
  });

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  const handleLessonClick = (lesson: { id: string; available: boolean; scheduledAt: string | null }) => {
    if (lesson.available) {
      navigate(`/student/lessons/${lesson.id}`);
    } else if (lesson.scheduledAt) {
      setScheduleModal({ isOpen: true, scheduledAt: lesson.scheduledAt });
    }
  };

  const handleAskQuestion = () => {
    // Открываем чат с ботом для вопросов
    // Бот перенаправит сообщение создателю курса
    window.open(`https://t.me/${TELEGRAM_BOT_USERNAME}?start=question`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Проект" showBack />
        <div className="p-4">
          <Card className="text-center py-8">
            <p className="text-[var(--tg-theme-hint-color)]">Проект не найден</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Назад" showBack />

      <div className="p-4 space-y-4">
        {/* Заголовок проекта */}
        <div>
          <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)] break-words">
            {course.title}
          </h1>
          <p className="text-[var(--tg-theme-hint-color)]">
            {course.totalLessons} материалов в {course.blocks.length} разделах
          </p>
        </div>

        {/* Секция "Задать вопрос" */}
        <Card className="border border-[var(--tg-theme-hint-color)]/20">
          <div className="text-center">
            <p className="text-[var(--tg-theme-text-color)] mb-1">
              💬 Есть вопросы по проекту?
            </p>
            <p className="text-sm text-[var(--tg-theme-hint-color)] mb-3">
              Напишите преподавателю
            </p>
            <Button 
              variant="secondary" 
              onClick={handleAskQuestion}
              className="min-w-[160px]"
            >
              Задать вопрос
            </Button>
          </div>
        </Card>

        {/* Разделы с материалами (Accordion) */}
        <div className="space-y-2">
          {course.blocks.map((block) => (
            <div key={block.id} className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl overflow-hidden">
              {/* Заголовок раздела */}
              <button
                onClick={() => toggleBlock(block.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">📂</span>
                  <span className="font-semibold text-[var(--tg-theme-text-color)] break-words">
                    {block.title}
                  </span>
                </div>
                <svg 
                  className={`w-5 h-5 text-[var(--tg-theme-hint-color)] transition-transform ${
                    expandedBlocks[block.id] ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Материалы раздела */}
              {expandedBlocks[block.id] && (
                <div className="border-t border-[var(--tg-theme-hint-color)]/10">
                  {block.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson)}
                      className={`
                        w-full flex items-center gap-3 p-4 text-left border-b border-[var(--tg-theme-hint-color)]/10 last:border-b-0
                        ${lesson.available ? 'active:bg-[var(--tg-theme-hint-color)]/10' : 'opacity-50'}
                      `}
                    >
                      {/* Иконка статуса */}
                      <span className="text-lg flex-shrink-0">
                        {lesson.available ? '▸' : '🔒'}
                      </span>
                      
                      {/* Название материала */}
                      <div className="flex-1">
                        <p className={`text-[var(--tg-theme-text-color)] break-words ${lesson.available ? '' : 'text-[var(--tg-theme-hint-color)]'}`}>
                          {lesson.title}
                        </p>
                        {!lesson.available && lesson.scheduledAt && (
                          <p className="text-sm text-[var(--tg-theme-hint-color)]">
                            Откроется: {lesson.scheduledAt}
                          </p>
                        )}
                      </div>

                      {/* Стрелка для доступных */}
                      {lesson.available && (
                        <svg className="w-5 h-5 text-[var(--tg-theme-hint-color)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Модалка расписания */}
      <ScheduleModal 
        isOpen={scheduleModal.isOpen}
        onClose={() => setScheduleModal({ isOpen: false, scheduledAt: null })}
        scheduledAt={scheduleModal.scheduledAt}
      />
    </div>
  );
}
