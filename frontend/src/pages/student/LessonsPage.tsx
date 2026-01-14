import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, PageContent, PageHeader } from '../../components/layout';
import { Card, Button, Icons } from '../../components/ui';
import { useStudentCourse } from '../../api/hooks';
import { useTelegram } from '../../hooks/useTelegram';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="max-w-sm w-full"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
      <Card 
        variant="active"
        className="text-center p-6"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--warning)]/10 flex items-center justify-center">
          <Icons.Clock className="w-10 h-10 text-[var(--warning)]" />
        </div>
        <h3 className="font-semibold text-[20px] text-dark mb-2">
          Материал откроется
        </h3>
        <p className="text-[16px] text-dark mb-3">
          {scheduledAt}
        </p>
        <p className="text-[13px] text-secondary mb-5 flex items-center justify-center gap-1">
          <Icons.Bell className="w-4 h-4" />
          Вы получите уведомление в Telegram
        </p>
        <Button fullWidth size="lg" onClick={onClose}>
          Понятно
        </Button>
      </Card>
      </div>
    </div>
  );
};

export default function LessonsPage() {
  const navigate = useNavigate();
  const { webApp } = useTelegram();
  const { data: course, isLoading } = useStudentCourse();
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [scheduleModal, setScheduleModal] = useState<{ isOpen: boolean; scheduledAt: string | null }>({
    isOpen: false,
    scheduledAt: null,
  });

  // ЗАЩИТА: Если курс требует оплату и не оплачен - редирект на оплату
  useEffect(() => {
    if (course && course.requiresPayment && !course.isPaid) {
      console.log('[LessonsPage] ⚠️ Доступ заблокирован: курс требует оплаты');
      navigate(`/student/payment?streamId=${course.streamId}`, { replace: true });
    }
  }, [course, navigate]);

  // Раскрыть первый блок по умолчанию при загрузке
  useEffect(() => {
    if (course?.blocks?.[0] && Object.keys(expandedBlocks).length === 0) {
      setExpandedBlocks({ [course.blocks[0].id]: true });
    }
  }, [course?.blocks]);

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
    const botUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=question`;
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(botUrl);
    } else {
      window.open(botUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-secondary text-[15px]">Загрузка...</div>
        </div>
      </PageContainer>
    );
  }

  if (!course) {
    return (
      <PageContainer>
        <PageHeader title="Проект" showBack />
        <PageContent>
          <Card variant="normal" className="text-center py-8">
            <p className="text-secondary">Проект не найден</p>
          </Card>
        </PageContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Назад" showBack />

      <PageContent>
        {/* Заголовок проекта */}
        <div className="mb-4">
          <h1 className="text-[24px] font-bold text-dark break-words">
            {course.title}
          </h1>
          <p className="text-[14px] text-secondary mt-1">
            {course.totalLessons} материалов в {course.blocks.length} разделах
          </p>
        </div>

        {/* Секция "Задать вопрос" */}
        <Card variant="normal" className="text-center mb-4">
          <Icons.Chat className="w-10 h-10 mx-auto mb-2 text-[var(--purple-main)]" />
          <p className="text-[15px] text-dark font-medium mb-1">
            Есть вопросы по проекту?
          </p>
          <p className="text-[13px] text-secondary mb-3">
            Напишите преподавателю
          </p>
          <Button 
            variant="secondary"
            size="md"
            onClick={handleAskQuestion}
          >
            <Icons.Telegram className="w-4 h-4" />
            Задать вопрос
          </Button>
        </Card>

        {/* Разделы с материалами (Accordion) */}
        <div className="space-y-3">
          {course.blocks.map((block) => (
            <Card key={block.id} variant="active" className="overflow-hidden p-0">
              {/* Заголовок раздела */}
              <button
                onClick={() => toggleBlock(block.id)}
                className="w-full flex items-center justify-between p-4 text-left active:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--terracotta-main)]/10 flex items-center justify-center flex-shrink-0">
                    <Icons.Book className="w-4 h-4 text-[var(--terracotta-main)]" />
                  </div>
                  <span className="font-semibold text-[16px] text-dark break-words">
                    {block.title}
                  </span>
                </div>
                <Icons.ArrowRight 
                  className={`w-5 h-5 text-secondary transition-transform flex-shrink-0 ${
                    expandedBlocks[block.id] ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* Материалы раздела */}
              {expandedBlocks[block.id] && (
                <div className="border-t border-[var(--purple-main)]/10">
                  {block.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson)}
                      className={`
                        w-full flex items-center gap-3 p-4 text-left border-b border-[var(--purple-main)]/10 last:border-b-0
                        ${lesson.available ? 'active:bg-[var(--purple-main)]/5' : 'opacity-60'}
                      `}
                    >
                      {/* Иконка статуса */}
                      <div className="flex-shrink-0">
                        {lesson.available ? (
                          <div className="w-6 h-6 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                            <Icons.Play className="w-3 h-3 text-[var(--success)]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[var(--text-muted)]/10 flex items-center justify-center">
                            <Icons.Lock className="w-3 h-3 text-muted" />
                          </div>
                        )}
                      </div>
                      
                      {/* Название материала */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[15px] break-words ${lesson.available ? 'text-dark' : 'text-muted'}`}>
                          {lesson.title}
                        </p>
                        {!lesson.available && lesson.scheduledAt && (
                          <p className="text-[12px] text-muted mt-0.5 flex items-center gap-1">
                            <Icons.Clock className="w-3 h-3" />
                            {lesson.scheduledAt}
                          </p>
                        )}
                      </div>

                      {/* Стрелка для доступных */}
                      {lesson.available && (
                        <Icons.ArrowRight className="w-5 h-5 text-secondary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </PageContent>

      {/* Модалка расписания */}
      <ScheduleModal 
        isOpen={scheduleModal.isOpen}
        onClose={() => setScheduleModal({ isOpen: false, scheduledAt: null })}
        scheduledAt={scheduleModal.scheduledAt}
      />
    </PageContainer>
  );
}
