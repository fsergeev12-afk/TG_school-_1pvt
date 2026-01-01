import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/ui';
import { useAuthStore } from '../../store';
import { useStudentCourse } from '../../api/hooks';

export default function StudentHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: course, isLoading, error } = useStudentCourse();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      </div>
    );
  }

  // Если нет проекта - показать приглашение
  if (error || !course) {
    return (
      <div className="min-h-screen">
        <PageHeader title={`Привет, ${user?.firstName || 'Участник'}! 👋`} />
        <div className="p-4">
          <Card className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="font-semibold text-lg text-[var(--tg-theme-text-color)] mb-2">
              Вы ещё не записаны на проект
            </h2>
            <p className="text-[var(--tg-theme-hint-color)] mb-4">
              Получите ссылку-приглашение от автора, чтобы начать
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Если требуется оплата
  if (course.requiresPayment && !course.isPaid) {
    return (
      <div className="min-h-screen">
        <PageHeader title={`Привет, ${user?.firstName || 'Участник'}! 👋`} />
        <div className="p-4">
          <Card className="overflow-hidden">
            {/* Иконка */}
            <div className="py-6 flex items-center justify-center bg-[var(--tg-theme-button-color)]/10">
              <span className="text-4xl">📚</span>
            </div>

            <div className="space-y-3 pt-4">
              <h2 className="font-semibold text-lg text-[var(--tg-theme-text-color)]">
                {course.title}
              </h2>
              <p className="text-[var(--tg-theme-hint-color)]">
                От {course.creatorName}
              </p>
              <p className="text-2xl font-bold text-[var(--tg-theme-text-color)]">
                {(course.price / 100).toLocaleString('ru-RU')} ₽
              </p>
              <Button fullWidth onClick={() => navigate(`/student/payment?streamId=${course.streamId}`)}>
                Оплатить
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Полный доступ к проекту
  return (
    <div className="min-h-screen">
      <PageHeader title={`Привет, ${user?.firstName || 'Участник'}! 👋`} />

      <div className="p-4">
        <Card className="overflow-hidden">
          {/* Иконка проекта */}
          <div className="py-6 flex items-center justify-center bg-[var(--tg-theme-button-color)]/10">
            <span className="text-4xl">📚</span>
          </div>

          {/* Информация о проекте */}
          <div className="space-y-3 pt-4">
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-xl flex-shrink-0">✅</span>
              <h2 className="font-semibold text-lg text-[var(--tg-theme-text-color)]">
                {course.title}
              </h2>
            </div>
            
            <p className="text-[var(--tg-theme-hint-color)]">
              {course.totalLessons} материалов | {course.allAvailable ? 'Все доступны' : `${course.availableLessons} доступно`}
            </p>

            <Button fullWidth onClick={() => navigate('/student/lessons')} className="mt-2">
              Перейти к проекту
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
