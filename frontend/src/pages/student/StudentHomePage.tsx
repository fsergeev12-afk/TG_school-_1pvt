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

  // Если нет курса - показать приглашение
  if (error || !course) {
    return (
      <div className="min-h-screen">
        <PageHeader title={`Привет, ${user?.firstName || 'Ученик'}! 👋`} />
        <div className="p-4">
          <Card className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="font-semibold text-lg text-[var(--tg-theme-text-color)] mb-2">
              Вы ещё не записаны на курс
            </h2>
            <p className="text-[var(--tg-theme-hint-color)] mb-4">
              Получите ссылку-приглашение от преподавателя, чтобы начать обучение
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
        <PageHeader title={`Привет, ${user?.firstName || 'Ученик'}! 👋`} />
        <div className="p-4">
          <Card className="overflow-hidden">
            {/* Обложка */}
            <div className="aspect-[16/9] relative -mx-4 -mt-4 mb-4">
              {course.coverImageUrl ? (
                <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white/50 text-sm">[Обложка курса]</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
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
                Оплатить курс
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Полный доступ к курсу
  return (
    <div className="min-h-screen">
      <PageHeader title={`Привет, ${user?.firstName || 'Ученик'}! 👋`} />

      <div className="p-4">
        <Card className="overflow-hidden">
          {/* Обложка курса */}
          <div className="aspect-[16/9] relative -mx-4 -mt-4 mb-4">
            {course.coverImageUrl ? (
              <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center">
                <span className="text-white/50 text-sm">[Дефолтная обложка]</span>
              </div>
            )}
          </div>

          {/* Информация о курсе */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-xl flex-shrink-0">✅</span>
              <h2 className="font-semibold text-lg text-[var(--tg-theme-text-color)]">
                {course.title}
              </h2>
            </div>
            
            <p className="text-[var(--tg-theme-hint-color)]">
              {course.totalLessons} уроков | {course.allAvailable ? 'Все доступны' : `${course.availableLessons} доступно`}
            </p>

            <Button fullWidth onClick={() => navigate('/student/lessons')} className="mt-2">
              Перейти к курсу
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
