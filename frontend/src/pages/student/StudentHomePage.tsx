import { useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader, PageContent } from '../../components/layout';
import { Card, Button } from '../../components/ui';
import { Icons } from '../../components/ui/Icons';
import { useAuthStore } from '../../store';
import { useStudentCourses } from '../../api/hooks';

export default function StudentHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: courses, isLoading, error } = useStudentCourses();

  if (isLoading) {
    return (
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-secondary text-[15px]">Загрузка...</div>
        </div>
      </PageContainer>
    );
  }

  // Если нет проектов - показать приглашение
  if (error || !courses || courses.length === 0) {
    return (
      <PageContainer>
        <PageHeader title={`Привет, ${user?.firstName || 'Участник'}!`} />
        <PageContent>
          <Card variant="active" className="text-center py-8">
            <Icons.Book className="w-12 h-12 mx-auto mb-3 text-[var(--terracotta-main)]" />
            <h2 className="font-semibold text-[17px] text-dark mb-2">
              Вы ещё не записаны на проекты
            </h2>
            <p className="text-[14px] text-secondary">
              Получите ссылку-приглашение от автора, чтобы начать
            </p>
          </Card>
        </PageContent>
      </PageContainer>
    );
  }

  // Показать список всех курсов
  return (
    <PageContainer>
      <PageHeader title={`Привет, ${user?.firstName || 'Участник'}!`} />

      <PageContent>
        <h2 className="text-[20px] font-semibold text-dark mb-4">
          Мои проекты ({courses.length})
        </h2>

        <div className="space-y-4">
          {courses.map((course) => {
            // Определяем, доступен ли курс для просмотра
            const isAccessible = course.isActivated && (!course.requiresPayment || course.isPaid);
            const needsActivation = !course.isActivated; // Только приглашен, но не активирован
            const needsPayment = course.isActivated && course.requiresPayment && !course.isPaid;
            
            return (
              <Card 
                key={course.id}
                variant={isAccessible ? 'active' : 'inactive'}
                accentLine={isAccessible}
                className="overflow-hidden"
              >
                {/* Информация о проекте */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    {/* Статус иконка */}
                    {isAccessible ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--success)]/10">
                        <Icons.Check className="w-5 h-5 text-[var(--success)]" />
                      </div>
                    ) : needsActivation ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--text-muted)]/10">
                        <Icons.Mail className="w-5 h-5 text-muted" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--warning)]/10">
                        <Icons.Clock className="w-5 h-5 text-[var(--warning)]" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-[17px] text-dark break-words">
                        {course.streamName || course.title}
                      </h3>
                      <p className="text-[14px] text-secondary mt-0.5">
                        От {course.creatorName}
                      </p>
                      {needsActivation && (
                        <p className="text-[12px] text-muted mt-1">
                          Требуется активация
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Цена и кнопка */}
                  {needsActivation || needsPayment ? (
                    <>
                      {course.price && course.price > 0 && (
                        <p className="text-[22px] font-bold text-dark">
                          {((course.price || 0) / 100).toLocaleString('ru-RU')} ₽
                        </p>
                      )}
                      <Button 
                        fullWidth
                        size="lg"
                        onClick={() => navigate(`/student/payment?accessToken=${course.accessToken}`)}
                      >
                        {needsActivation ? 'Активировать' : 'Оплатить'}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      fullWidth
                      size="lg"
                      variant="secondary"
                      onClick={() => {
                        localStorage.setItem('currentCourseToken', course.accessToken);
                        navigate('/student/lessons');
                      }}
                    >
                      Перейти к проекту
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </PageContent>
    </PageContainer>
  );
}
