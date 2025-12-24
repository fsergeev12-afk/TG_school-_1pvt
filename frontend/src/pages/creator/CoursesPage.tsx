import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses, useDeleteCourse } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Button, Card } from '../../components/ui';
import { useUIStore } from '../../store';

export default function CoursesPage() {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useCourses();
  const deleteCourse = useDeleteCourse();
  const { showToast } = useUIStore();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (courseId: string) => {
    try {
      await deleteCourse.mutateAsync(courseId);
      setDeletingId(null);
      showToast('Курс удалён', 'success');
    } catch {
      showToast('Ошибка удаления курса', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Мои курсы"
        subtitle={courses ? `${courses.length} курсов` : undefined}
        action={
          <Button size="sm" onClick={() => navigate('/creator/courses/new')}>
            + Создать
          </Button>
        }
      />

      <div className="p-4 space-y-3">

        {/* Загрузка */}
        {isLoading && (
          <div className="text-center py-8 text-[var(--tg-theme-hint-color)]">
            Загрузка...
          </div>
        )}

        {/* Пустой список */}
        {!isLoading && courses?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-[var(--tg-theme-hint-color)]">
              Пока нет курсов
            </p>
            <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
              Создайте первый курс для старта
            </p>
            <Button className="mt-4" onClick={() => navigate('/creator/courses/new')}>
              + Создать курс
            </Button>
          </div>
        )}

        {/* Список курсов */}
        {courses?.map((course) => (
          <Card key={course.id}>
            <div className="flex items-start gap-3">
              {course.coverImageUrl ? (
                <img
                  src={course.coverImageUrl}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center text-2xl">
                  📚
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--tg-theme-text-color)] truncate">
                  {course.title}
                </h3>
                <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
                  {course.blocks?.length || 0} блоков • {
                    course.blocks?.reduce((sum, b) => sum + (b.lessons?.length || 0), 0) || 0
                  } уроков
                </p>
                
                {/* Кнопки по PRD */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/creator/courses/${course.id}`)}
                  >
                    ✏️ Редактировать
                  </Button>
                  {deletingId === course.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleDelete(course.id)}
                        loading={deleteCourse.isPending}
                      >
                        Да
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setDeletingId(null)}
                      >
                        Нет
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDeletingId(course.id)}
                    >
                      🗑️ Удалить
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
