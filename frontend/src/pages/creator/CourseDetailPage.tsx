import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCourse, useCreateBlock, useCreateLesson } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Card, Badge, Button, Input } from '../../components/ui';
import { useUIStore } from '../../store';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: course, isLoading } = useCourse(id!);
  const createBlock = useCreateBlock();
  const createLesson = useCreateLesson();
  const { showToast } = useUIStore();

  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [addingLessonToBlockId, setAddingLessonToBlockId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const handleAddBlock = async () => {
    if (!newBlockTitle.trim() || !id) return;
    try {
      await createBlock.mutateAsync({ courseId: id, title: newBlockTitle.trim() });
      setNewBlockTitle('');
      setIsAddingBlock(false);
      showToast('Блок добавлен!', 'success');
    } catch {
      showToast('Ошибка добавления блока', 'error');
    }
  };

  const handleAddLesson = async (blockId: string) => {
    if (!newLessonTitle.trim()) return;
    try {
      await createLesson.mutateAsync({ blockId, title: newLessonTitle.trim() });
      setNewLessonTitle('');
      setAddingLessonToBlockId(null);
      showToast('Урок добавлен!', 'success');
    } catch {
      showToast('Ошибка добавления урока', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--tg-theme-hint-color)]">Курс не найден</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={course.title}
        showBack
        action={
          <Badge variant={course.isPublished ? 'success' : 'default'}>
            {course.isPublished ? 'Опубликован' : 'Черновик'}
          </Badge>
        }
      />

      <div className="p-4 space-y-4">
        {/* Информация о курсе */}
        <Card>
          <div className="flex items-center gap-4">
            {course.coverImageUrl ? (
              <img
                src={course.coverImageUrl}
                alt=""
                className="w-20 h-20 rounded-xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center text-3xl">
                📚
              </div>
            )}
            <div>
              <p className="text-sm text-[var(--tg-theme-hint-color)]">
                {course.blocks?.length || 0} блоков • {
                  course.blocks?.reduce((sum, b) => sum + (b.lessons?.length || 0), 0) || 0
                } уроков
              </p>
              {course.description && (
                <p className="text-sm text-[var(--tg-theme-text-color)] mt-1">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Действия */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" fullWidth>
            ✏️ Редактировать
          </Button>
          <Button variant="secondary" fullWidth>
            👥 Потоки
          </Button>
        </div>

        {/* Структура курса */}
        <div>
          <h2 className="font-semibold text-[var(--tg-theme-text-color)] mb-3">
            Структура курса
          </h2>

          {/* Форма добавления блока */}
          {isAddingBlock && (
            <Card className="mb-3 space-y-2">
              <Input
                placeholder="Название блока"
                value={newBlockTitle}
                onChange={(e) => setNewBlockTitle(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  fullWidth
                  size="sm"
                  onClick={handleAddBlock}
                  loading={createBlock.isPending}
                >
                  Добавить
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsAddingBlock(false);
                    setNewBlockTitle('');
                  }}
                >
                  Отмена
                </Button>
              </div>
            </Card>
          )}

          {course.blocks?.length === 0 && !isAddingBlock ? (
            <Card className="text-center py-8">
              <p className="text-[var(--tg-theme-hint-color)]">
                Добавьте первый блок курса
              </p>
              <Button className="mt-3" size="sm" onClick={() => setIsAddingBlock(true)}>
                + Добавить блок
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {course.blocks?.map((block, blockIndex) => (
                <Card key={block.id} padding="sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[var(--tg-theme-text-color)]">
                      {blockIndex + 1}. {block.title}
                    </span>
                    <span className="text-xs text-[var(--tg-theme-hint-color)]">
                      {block.lessons?.length || 0} уроков
                    </span>
                  </div>
                  
                  {block.lessons?.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-2 py-2 pl-4 border-l-2 border-[var(--tg-theme-hint-color)]/20"
                    >
                      <span className="text-sm text-[var(--tg-theme-hint-color)]">
                        {blockIndex + 1}.{lessonIndex + 1}
                      </span>
                      <span className="text-sm text-[var(--tg-theme-text-color)] flex-1 truncate">
                        {lesson.title}
                      </span>
                      {lesson.videoType && (
                        <span className="text-xs">🎬</span>
                      )}
                    </div>
                  ))}

                  {/* Форма добавления урока */}
                  {addingLessonToBlockId === block.id ? (
                    <div className="mt-2 space-y-2">
                      <Input
                        placeholder="Название урока"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          fullWidth
                          size="sm"
                          onClick={() => handleAddLesson(block.id)}
                          loading={createLesson.isPending}
                        >
                          Добавить
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setAddingLessonToBlockId(null);
                            setNewLessonTitle('');
                          }}
                        >
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setAddingLessonToBlockId(block.id)}
                    >
                      + Добавить урок
                    </Button>
                  )}
                </Card>
              ))}

              {!isAddingBlock && (
                <Button variant="secondary" fullWidth onClick={() => setIsAddingBlock(true)}>
                  + Добавить блок
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


