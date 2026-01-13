import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses, useDeleteCourse, useCourseStreamsCount } from '../../api/hooks';
import { PageContainer, PageContent, PageHeader } from '../../components/layout';
import { Button, Card, Modal, Icons } from '../../components/ui';
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
    <PageContainer>
      <PageHeader
        title="Modula"
        subtitle={courses ? `${courses.length} проектов` : 'Мои проекты'}
        action={
          <Button size="sm" onClick={() => navigate('/creator/courses/new')}>
            <Icons.Plus className="w-4 h-4" />
          </Button>
        }
      />

      <PageContent>
        {/* Загрузка */}
        {isLoading && (
          <div className="text-center py-8 text-secondary text-[15px]">
            Загрузка...
          </div>
        )}

        {/* Пустой список */}
        {!isLoading && courses?.length === 0 && (
          <div className="text-center py-12">
            <Icons.Book className="w-16 h-16 mx-auto mb-4 text-[var(--terracotta-main)]" />
            <p className="text-[15px] text-secondary mb-1">
              Пока нет проектов
            </p>
            <p className="text-[13px] text-muted">
              Создайте первый проект для старта
            </p>
            <Button className="mt-5" onClick={() => navigate('/creator/courses/new')}>
              <Icons.Plus className="w-5 h-5" />
              Создать проект
            </Button>
          </div>
        )}

        {/* Список проектов */}
        <div className="space-y-3">
          {courses?.map((course) => (
            <Card key={course.id} variant="active" accentLine>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--terracotta-main)]/10 flex items-center justify-center">
                  <Icons.Book className="w-6 h-6 text-[var(--terracotta-main)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[17px] text-dark">
                    {course.title}
                  </h3>
                  <p className="text-[13px] text-secondary mt-0.5">
                    {course.blocks?.length || 0} разделов • {
                      course.blocks?.reduce((sum, b) => sum + (b.lessons?.length || 0), 0) || 0
                    } материалов
                  </p>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/creator/courses/${course.id}`)}
                    >
                      <Icons.Edit className="w-4 h-4" />
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirm({ id: course.id, title: course.title })}
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageContent>

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
    </PageContainer>
  );
}
