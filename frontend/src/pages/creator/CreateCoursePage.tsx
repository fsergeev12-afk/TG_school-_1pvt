import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCourse, useCreateBlock, useCreateLesson } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Button, Card, Input } from '../../components/ui';
import { useUIStore } from '../../store';

interface BlockDraft {
  id: string;
  title: string;
  lessons: LessonDraft[];
}

interface LessonDraft {
  id: string;
  title: string;
  description?: string;
  videoType?: 'telegram' | 'external';
  videoUrl?: string;
}

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const createCourse = useCreateCourse();
  const createBlock = useCreateBlock();
  const createLesson = useCreateLesson();
  const { showToast } = useUIStore();

  // Шаги
  const [step, setStep] = useState(1);

  // Шаг 1: Информация о курсе
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Шаг 2: Структура
  const [blocks, setBlocks] = useState<BlockDraft[]>([]);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [addingLessonToBlock, setAddingLessonToBlock] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDescription, setNewLessonDescription] = useState('');

  const [isPublishing, setIsPublishing] = useState(false);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Файл слишком большой (макс 5MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeCover = () => {
    setCoverPreview(null);
  };

  const addBlock = () => {
    if (!newBlockTitle.trim()) return;
    setBlocks([
      ...blocks,
      {
        id: `temp-${Date.now()}`,
        title: newBlockTitle.trim(),
        lessons: [],
      },
    ]);
    setNewBlockTitle('');
    setIsAddingBlock(false);
  };

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const addLesson = (blockId: string) => {
    if (!newLessonTitle.trim()) return;
    setBlocks(
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              lessons: [
                ...block.lessons,
                {
                  id: `temp-${Date.now()}`,
                  title: newLessonTitle.trim(),
                  description: newLessonDescription.trim() || undefined,
                },
              ],
            }
          : block
      )
    );
    setNewLessonTitle('');
    setNewLessonDescription('');
    setAddingLessonToBlock(null);
  };

  const removeLesson = (blockId: string, lessonId: string) => {
    setBlocks(
      blocks.map((block) =>
        block.id === blockId
          ? { ...block, lessons: block.lessons.filter((l) => l.id !== lessonId) }
          : block
      )
    );
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      showToast('Введите название курса', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      // 1. Создаём курс
      const course = await createCourse.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      // 2. Создаём блоки и уроки
      for (const blockDraft of blocks) {
        const block = await createBlock.mutateAsync({
          courseId: course.id,
          title: blockDraft.title,
        });

        for (const lessonDraft of blockDraft.lessons) {
          await createLesson.mutateAsync({
            blockId: block.id,
            title: lessonDraft.title,
            description: lessonDraft.description,
          });
        }
      }

      showToast('Курс создан!', 'success');
      navigate(`/creator/courses/${course.id}`);
    } catch {
      showToast('Ошибка создания курса', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const totalLessons = blocks.reduce((sum, b) => sum + b.lessons.length, 0);

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)]">
      <PageHeader
        title="Создание курса"
        subtitle={`Шаг ${step} из 2`}
        showBack
        onBack={() => {
          if (step === 2) {
            setStep(1);
          } else {
            navigate('/creator/courses');
          }
        }}
      />

      {/* Progress */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <div className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-[var(--tg-theme-button-color)]' : 'bg-[var(--tg-theme-hint-color)]/30'}`} />
          <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-[var(--tg-theme-button-color)]' : 'bg-[var(--tg-theme-hint-color)]/30'}`} />
        </div>
      </div>

      <div className="p-4 pb-40">
        {/* Шаг 1: Информация */}
        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Название курса *"
              placeholder="Основы тайм-менеджмента"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />

            <div>
              <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
                Описание курса
              </label>
              <textarea
                className="w-full p-3 rounded-xl border border-[var(--tg-theme-hint-color)]/30 bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] min-h-[100px] resize-none"
                placeholder="Расскажите о чём этот курс..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
              <div className="text-right text-xs text-[var(--tg-theme-hint-color)] mt-1">
                {description.length} / 500
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
                Обложка курса
              </label>
              {coverPreview ? (
                <div className="relative">
                  <img
                    src={coverPreview}
                    alt="Обложка"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    onClick={removeCover}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-[var(--tg-theme-hint-color)]/30 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--tg-theme-button-color)]/50 transition-colors">
                    <div className="text-3xl mb-2">📤</div>
                    <p className="text-sm text-[var(--tg-theme-hint-color)]">
                      Загрузить изображение
                    </p>
                    <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                      JPG, PNG • до 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Шаг 2: Структура */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[var(--tg-theme-text-color)]">
              Структура курса
            </h2>
            <p className="text-sm text-[var(--tg-theme-hint-color)]">
              {blocks.length} блоков • {totalLessons} уроков
            </p>

            {/* Список блоков */}
            {blocks.map((block, blockIndex) => (
              <Card key={block.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📂</span>
                    <span className="font-medium text-[var(--tg-theme-text-color)]">
                      Блок {blockIndex + 1}: {block.title}
                    </span>
                  </div>
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="text-red-500 text-sm"
                  >
                    🗑️
                  </button>
                </div>

                {/* Уроки */}
                {block.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between pl-6 py-2 border-l-2 border-[var(--tg-theme-hint-color)]/20"
                  >
                    <span className="text-sm text-[var(--tg-theme-text-color)]">
                      {blockIndex + 1}.{lessonIndex + 1} {lesson.title}
                    </span>
                    <button
                      onClick={() => removeLesson(block.id, lesson.id)}
                      className="text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Добавление урока */}
                {addingLessonToBlock === block.id ? (
                  <div className="pl-6 space-y-2">
                    <Input
                      placeholder="Название урока"
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      autoFocus
                    />
                    <Input
                      placeholder="Описание (опционально)"
                      value={newLessonDescription}
                      onChange={(e) => setNewLessonDescription(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => addLesson(block.id)}>
                        Добавить
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setAddingLessonToBlock(null);
                          setNewLessonTitle('');
                          setNewLessonDescription('');
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingLessonToBlock(block.id)}
                    className="text-sm text-[var(--tg-theme-button-color)] pl-6"
                  >
                    + Добавить урок
                  </button>
                )}
              </Card>
            ))}

            {/* Добавление блока */}
            {isAddingBlock ? (
              <Card className="space-y-3">
                <Input
                  placeholder="Название блока"
                  value={newBlockTitle}
                  onChange={(e) => setNewBlockTitle(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button fullWidth size="sm" onClick={addBlock}>
                    Создать блок
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIsAddingBlock(false);
                      setNewBlockTitle('');
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </Card>
            ) : (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setIsAddingBlock(true)}
              >
                + Создать блок
              </Button>
            )}

            {blocks.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📂</div>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">
                  Добавьте первый блок курса
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - above BottomNav */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-[var(--tg-theme-bg-color)] border-t border-[var(--tg-theme-hint-color)]/20">
        {step === 1 ? (
          <Button
            fullWidth
            onClick={() => setStep(2)}
            disabled={!title.trim()}
          >
            Далее →
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Назад
            </Button>
            <Button
              fullWidth
              onClick={handlePublish}
              loading={isPublishing}
            >
              🚀 Опубликовать курс
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

