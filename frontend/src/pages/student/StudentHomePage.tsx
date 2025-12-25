import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/ui';
import { useAuthStore } from '../../store';

export default function StudentHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // TODO: Получить данные о курсе студента из API
  // const { data: studentCourse } = useStudentCourse();
  
  // Mock данные - заменить на реальные
  const course = {
    id: '1',
    title: 'Основы тайм-менеджмента',
    coverUrl: null, // null = дефолтная обложка
    lessonsCount: 9,
    isPaid: true, // true = "Все доступны", false = "Первый урок доступен"
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title={`Привет, ${user?.firstName || 'Ученик'}! 👋`}
      />

      <div className="p-4">
        {/* Карточка курса */}
        <Card className="overflow-hidden">
          {/* Обложка курса */}
          <div className="aspect-[16/9] relative -mx-4 -mt-4 mb-4">
            {course.coverUrl ? (
              <img 
                src={course.coverUrl} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              // Дефолтная обложка - зелёный градиент как на макете
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
              {course.lessonsCount} уроков | {course.isPaid ? 'Все доступны' : 'Первый урок доступен'}
            </p>

            <Button 
              fullWidth 
              onClick={() => navigate('/student/lessons')}
              className="mt-2"
            >
              Перейти к курсу
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
