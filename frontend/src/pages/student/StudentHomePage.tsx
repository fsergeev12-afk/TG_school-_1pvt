import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/ui';
import { useAuthStore } from '../../store';
import { useStudentCourses } from '../../api/hooks';

export default function StudentHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: courses, isLoading, error } = useStudentCourses();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      </div>
    );
  }

  // Если нет проектов - показать приглашение
  if (error || !courses || courses.length === 0) {
    return (
      <div className="min-h-screen">
        <PageHeader title={`Привет, ${user?.firstName || 'Участник'}! 👋`} />
        <div className="p-4">
          <Card className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="font-semibold text-lg text-[var(--tg-theme-text-color)] mb-2">
              Вы ещё не записаны на проекты
            </h2>
            <p className="text-[var(--tg-theme-hint-color)] mb-4">
              Получите ссылку-приглашение от автора, чтобы начать
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Показать список всех курсов
  return (
    <div className="min-h-screen">
      <PageHeader title={`Привет, ${user?.firstName || 'Участник'}! 👋`} />

      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)]">
          Мои проекты ({courses.length})
        </h2>

        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            {/* Иконка проекта */}
            <div className="py-6 flex items-center justify-center bg-[var(--tg-theme-button-color)]/10">
              <span className="text-4xl">📚</span>
            </div>

            {/* Информация о проекте */}
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-2">
                {course.isPaid ? (
                  <span className="text-green-500 text-xl flex-shrink-0">✅</span>
                ) : (
                  <span className="text-orange-500 text-xl flex-shrink-0">⏳</span>
                )}
                <div>
                  <h3 className="font-semibold text-lg text-[var(--tg-theme-text-color)] break-words">
                    {course.title}
                  </h3>
                  {course.streamName && (
                    <p className="text-xs text-[var(--tg-theme-hint-color)]">
                      Поток: {course.streamName}
                    </p>
                  )}
                </div>
              </div>
              
              <p className="text-[var(--tg-theme-hint-color)] text-sm">
                От {course.creatorName}
              </p>

              {course.requiresPayment && !course.isPaid ? (
                <>
                  <p className="text-xl font-bold text-[var(--tg-theme-text-color)]">
                    {((course.price || 0) / 100).toLocaleString('ru-RU')} ₽
                  </p>
                  <Button 
                    fullWidth 
                    onClick={() => navigate(`/student/payment?streamId=${course.streamId}`)}
                  >
                    Оплатить
                  </Button>
                </>
              ) : (
                <Button 
                  fullWidth 
                  onClick={() => {
                    // Сохраняем accessToken в localStorage для навигации
                    localStorage.setItem('currentCourseToken', course.accessToken);
                    navigate('/student/lessons');
                  }}
                  className="mt-2"
                >
                  Перейти к проекту
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
