import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses, useDeleteCourse, useCourseStreamsCount } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Button, Card, Modal } from '../../components/ui';
import { useUIStore } from '../../store';

export default function CoursesPage() {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useCourses();
  const deleteCourse = useDeleteCourse();
  const { showToast } = useUIStore();

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const { data: streamsCount, isLoading: loadingStreamsCount } = useCourseStreamsCount(deleteConfirm?.id || '');

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const result = await deleteCourse.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
      if (result.deletedStreams > 0) {
        showToast(`Проект удалён (${result.deletedStreams} потоков)`, 'success');
      } else {
        showToast('Проект удалён', 'success');
      }
    } catch {
      showToast('Ошибка удаления проекта', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Modula"
        subtitle={courses ? `${courses.length} проектов` : 'Мои проекты'}
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
              Пока нет проектов
            </p>
            <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
              Создайте первый проект для старта
            </p>
            <Button className="mt-4" onClick={() => navigate('/creator/courses/new')}>
              + Создать проект
            </Button>
          </div>
        )}

        {/* Список проектов */}
        {courses?.map((course) => (
          <Card key={course.id}>
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center text-2xl">
                📚
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--tg-theme-text-color)] truncate">
                  {course.title}
                </h3>
                <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
                  {course.blocks?.length || 0} разделов • {
                    course.blocks?.reduce((sum, b) => sum + (b.lessons?.length || 0), 0) || 0
                  } материалов
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
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setDeleteConfirm({ id: course.id, title: course.title })}
                  >
                    🗑️ Удалить
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={`Удалить «${deleteConfirm?.title}»?`}
        size="sm"
      >
        <div className="space-y-4">
          {loadingStreamsCount ? (
            <p className="text-sm text-[var(--tg-theme-hint-color)]">Проверка связанных потоков...</p>
          ) : streamsCount && streamsCount > 0 ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Внимание! К этому проекту привязано {streamsCount} потоков.
              </p>
              <p className="text-xs text-red-600 mt-1">
                При удалении проекта все потоки и доступ участников будут потеряны.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--tg-theme-hint-color)]">
              Проект и все его материалы будут удалены.
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setDeleteConfirm(null)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDelete}
              loading={deleteCourse.isPending}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
