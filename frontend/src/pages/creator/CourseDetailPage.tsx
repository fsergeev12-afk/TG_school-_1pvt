import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourse, useCreateBlock, useCreateLesson, useUpdateLesson, usePublishCourse, useUnpublishCourse } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Card, Badge, Button, Input, Modal } from '../../components/ui';
import { useUIStore } from '../../store';
import { Lesson } from '../../types';

type VideoType = 'telegram' | 'external' | null;

interface LessonFormData {
  title: string;
  description: string;
  videoType: VideoType;
  videoUrl: string;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading } = useCourse(id!);
  const createBlock = useCreateBlock();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const publishCourse = usePublishCourse();
  const unpublishCourse = useUnpublishCourse();
  const { showToast } = useUIStore();

  // Block creation
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');

  // Lesson modal
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonBlockId, setLessonBlockId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormData>({
    title: '',
    description: '',
    videoType: null,
    videoUrl: '',
  });

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

  const openCreateLesson = (blockId: string) => {
    setLessonBlockId(blockId);
    setEditingLesson(null);
    setLessonForm({
      title: '',
      description: '',
      videoType: null,
      videoUrl: '',
    });
    setLessonModalOpen(true);
  };

  const openEditLesson = (lesson: Lesson, blockId: string) => {
    setLessonBlockId(blockId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      videoType: lesson.videoType || null,
      videoUrl: lesson.videoExternalUrl || lesson.videoUrl || '',
    });
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      showToast('Введите название урока', 'error');
      return;
    }

    try {
      if (editingLesson) {
        // Update existing lesson
        await updateLesson.mutateAsync({
          id: editingLesson.id,
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim() || undefined,
          videoType: lessonForm.videoType || undefined,
          videoUrl: lessonForm.videoUrl.trim() || undefined,
        });
        showToast('Урок обновлён!', 'success');
      } else if (lessonBlockId) {
        // Create new lesson
        await createLesson.mutateAsync({
          blockId: lessonBlockId,
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim() || undefined,
          videoType: lessonForm.videoType || undefined,
          videoUrl: lessonForm.videoUrl.trim() || undefined,
        });
        showToast('Урок добавлен!', 'success');
      }
      setLessonModalOpen(false);
    } catch {
      showToast('Ошибка сохранения урока', 'error');
    }
  };

  const handleTogglePublish = async () => {
    if (!id) return;
    try {
      if (course?.isPublished) {
        await unpublishCourse.mutateAsync(id);
        showToast('Курс снят с публикации', 'success');
      } else {
        await publishCourse.mutateAsync(id);
        showToast('Курс опубликован!', 'success');
      }
    } catch {
      showToast('Ошибка', 'error');
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

  const totalLessons = course.blocks?.reduce((sum, b) => sum + (b.lessons?.length || 0), 0) || 0;

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
            <div className="flex-1">
              <p className="text-sm text-[var(--tg-theme-hint-color)]">
                {course.blocks?.length || 0} блоков • {totalLessons} уроков
              </p>
              {course.description && (
                <p className="text-sm text-[var(--tg-theme-text-color)] mt-1 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Действия */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleTogglePublish}
            loading={publishCourse.isPending || unpublishCourse.isPending}
          >
            {course.isPublished ? '📤 Снять' : '🚀 Опубликовать'}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/creator/streams')}
          >
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
                      📂 {blockIndex + 1}. {block.title}
                    </span>
                    <span className="text-xs text-[var(--tg-theme-hint-color)]">
                      {block.lessons?.length || 0} уроков
                    </span>
                  </div>

                  {block.lessons?.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      onClick={() => openEditLesson(lesson, block.id)}
                      className="flex items-center gap-2 py-2 pl-4 border-l-2 border-[var(--tg-theme-hint-color)]/20 cursor-pointer hover:bg-[var(--tg-theme-hint-color)]/5 rounded-r-lg transition-colors"
                    >
                      <span className="text-sm text-[var(--tg-theme-hint-color)]">
                        {blockIndex + 1}.{lessonIndex + 1}
                      </span>
                      <span className="text-sm text-[var(--tg-theme-text-color)] flex-1 truncate">
                        {lesson.title}
                      </span>
                      {lesson.videoType && (
                        <span className="text-xs">
                          {lesson.videoType === 'telegram' ? '📹' : '🔗'}
                        </span>
                      )}
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => openCreateLesson(block.id)}
                  >
                    + Добавить урок
                  </Button>
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

      {/* Lesson Modal */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLesson ? '✏️ Редактировать урок' : '📝 Новый урок'}
      >
        <div className="space-y-4">
          <Input
            label="Название урока *"
            placeholder="Введение в тему"
            value={lessonForm.title}
            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
              Описание урока
            </label>
            <textarea
              className="w-full p-3 rounded-xl border border-[var(--tg-theme-hint-color)]/30 bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] min-h-[80px] resize-none"
              placeholder="О чём этот урок..."
              value={lessonForm.description}
              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
              🎬 Видео
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setLessonForm({ ...lessonForm, videoType: 'telegram', videoUrl: '' })}
                className={`p-3 rounded-xl border-2 text-sm transition-colors ${
                  lessonForm.videoType === 'telegram'
                    ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10'
                    : 'border-[var(--tg-theme-hint-color)]/30'
                }`}
              >
                📹 Загрузить
                <div className="text-xs text-[var(--tg-theme-hint-color)] mt-1">до 50MB</div>
              </button>
              <button
                onClick={() => setLessonForm({ ...lessonForm, videoType: 'external', videoUrl: '' })}
                className={`p-3 rounded-xl border-2 text-sm transition-colors ${
                  lessonForm.videoType === 'external'
                    ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10'
                    : 'border-[var(--tg-theme-hint-color)]/30'
                }`}
              >
                🔗 Ссылка
                <div className="text-xs text-[var(--tg-theme-hint-color)] mt-1">YouTube, Vimeo</div>
              </button>
            </div>

            {lessonForm.videoType === 'telegram' && (
              <div className="border-2 border-dashed border-[var(--tg-theme-hint-color)]/30 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">📤</div>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">
                  Загрузка видео через Telegram-бота
                </p>
                <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                  Функция в разработке
                </p>
              </div>
            )}

            {lessonForm.videoType === 'external' && (
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
              />
            )}

            {lessonForm.videoType && (
              <button
                onClick={() => setLessonForm({ ...lessonForm, videoType: null, videoUrl: '' })}
                className="text-sm text-[var(--tg-theme-hint-color)] mt-2"
              >
                ✕ Убрать видео
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--tg-theme-hint-color)]/20">
            <Button
              fullWidth
              onClick={handleSaveLesson}
              loading={createLesson.isPending || updateLesson.isPending}
            >
              {editingLesson ? 'Сохранить изменения' : 'Создать урок'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
