import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button, Badge } from '../../components/ui';
import { useAuthStore } from '../../store';

export default function StudentHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // TODO: Получить данные о курсе студента
  // const { data: studentData } = useStudentCourse();

  return (
    <div>
      <PageHeader
        title={`Привет, ${user?.firstName || 'Ученик'}! 👋`}
      />

      <div className="p-4 space-y-4">
        {/* Прогресс */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
              Ваш прогресс
            </h3>
            <Badge variant="info">3/10 уроков</Badge>
          </div>
          <div className="w-full h-2 bg-[var(--tg-theme-hint-color)]/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--tg-theme-button-color)] rounded-full transition-all"
              style={{ width: '30%' }}
            />
          </div>
          <p className="text-sm text-[var(--tg-theme-hint-color)] mt-2">
            Отличный старт! Продолжайте обучение
          </p>
        </Card>

        {/* Текущий урок */}
        <Card>
          <h3 className="font-semibold text-[var(--tg-theme-text-color)] mb-3">
            Продолжить обучение
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center text-2xl">
              🎬
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--tg-theme-text-color)]">
                Урок 4: Основы работы
              </p>
              <p className="text-sm text-[var(--tg-theme-hint-color)]">
                15 минут
              </p>
            </div>
          </div>
          <Button 
            fullWidth 
            className="mt-4"
            onClick={() => navigate('/student/lessons')}
          >
            Продолжить
          </Button>
        </Card>

        {/* Информация о курсе */}
        <Card>
          <h3 className="font-semibold text-[var(--tg-theme-text-color)] mb-2">
            О курсе
          </h3>
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Здесь будет информация о вашем курсе и создателе.
          </p>
        </Card>
      </div>
    </div>
  );
}

