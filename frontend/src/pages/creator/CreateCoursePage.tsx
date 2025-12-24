import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCourse, useCreateBlock, useCreateLesson } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Button, Card, Input, Modal, SortableList } from '../../components/ui';
import { useUIStore } from '../../store';

interface LessonDraft {
  id: string;
  title: string;
  description?: string;
  videoType?: 'telegram' | 'external' | null;
  videoUrl?: string;
}

interface BlockDraft {
  id: string;
  title: string;
  lessons: LessonDraft[];
}

type VideoType = 'telegram' | 'external' | null;

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
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  // Модалка добавления блока
  const [addBlockModalOpen, setAddBlockModalOpen] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');

  // Редактирование блока
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editBlockTitle, setEditBlockTitle] = useState('');

  // Модалка урока
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonBlockId, setLessonBlockId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<LessonDraft | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    videoType: null as VideoType,
    videoUrl: '',
  });

  const [isCreating, setIsCreating] = useState(false);

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

  // Блоки
  const openAddBlockModal = () => {
    setNewBlockTitle('');
    setAddBlockModalOpen(true);
  };

  const addBlock = () => {
    if (!newBlockTitle.trim()) return;
    const newBlock: BlockDraft = {
      id: `temp-${Date.now()}`,
      title: newBlockTitle.trim(),
      lessons: [],
    };
    setBlocks([...blocks, newBlock]);
    setExpandedBlocks(new Set([...expandedBlocks, newBlock.id]));
    setNewBlockTitle('');
    setAddBlockModalOpen(false);
  };

  const handleBlockKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBlock();
    }
  };

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const startEditBlock = (block: BlockDraft) => {
    setEditingBlockId(block.id);
    setEditBlockTitle(block.title);
  };

  const saveBlockTitle = () => {
    if (!editingBlockId || !editBlockTitle.trim()) return;
    setBlocks(blocks.map(b => 
      b.id === editingBlockId ? { ...b, title: editBlockTitle.trim() } : b
    ));
    setEditingBlockId(null);
    setEditBlockTitle('');
  };

  const handleEditBlockKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBlockTitle();
    } else if (e.key === 'Escape') {
      setEditingBlockId(null);
    }
  };

  const toggleBlockExpanded = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId);
    } else {
      newExpanded.add(blockId);
    }
    setExpandedBlocks(newExpanded);
  };

  const handleBlocksReorder = (reordered: BlockDraft[]) => {
    setBlocks(reordered);
  };

  // Уроки
  const openCreateLesson = (blockId: string) => {
    setLessonBlockId(blockId);
    setEditingLesson(null);
    setLessonForm({ title: '', description: '', videoType: null, videoUrl: '' });
    setLessonModalOpen(true);
  };

  const openEditLesson = (lesson: LessonDraft, blockId: string) => {
    setLessonBlockId(blockId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      videoType: lesson.videoType || null,
      videoUrl: lesson.videoUrl || '',
    });
    setLessonModalOpen(true);
  };

  const saveLesson = () => {
    if (!lessonForm.title.trim() || !lessonBlockId) return;

    const lessonData: LessonDraft = {
      id: editingLesson?.id || `temp-${Date.now()}`,
      title: lessonForm.title.trim(),
      description: lessonForm.description.trim() || undefined,
      videoType: lessonForm.videoType,
      videoUrl: lessonForm.videoUrl.trim() || undefined,
    };

    if (editingLesson) {
      // Update existing
      setBlocks(blocks.map(block =>
        block.id === lessonBlockId
          ? { ...block, lessons: block.lessons.map(l => l.id === editingLesson.id ? lessonData : l) }
          : block
      ));
    } else {
      // Add new
      setBlocks(blocks.map(block =>
        block.id === lessonBlockId
          ? { ...block, lessons: [...block.lessons, lessonData] }
          : block
      ));
    }

    setLessonModalOpen(false);
  };

  const removeLesson = (e: React.MouseEvent, blockId: string, lessonId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? { ...block, lessons: block.lessons.filter(l => l.id !== lessonId) }
        : block
    ));
  };

  const handleLessonsReorder = (blockId: string, reordered: LessonDraft[]) => {
    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, lessons: reordered } : block
    ));
  };

  // Создание курса
  const handleCreate = async () => {
    if (!title.trim()) {
      showToast('Введите название курса', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const course = await createCourse.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      });

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
            videoType: lessonDraft.videoType || undefined,
            videoUrl: lessonDraft.videoUrl,
          });
        }
      }

      showToast('Курс создан!', 'success');
      // Редирект на страницу курсов, а не на редактирование
      navigate('/creator/courses');
    } catch {
      showToast('Ошибка создания курса', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const totalLessons = blocks.reduce((sum, b) => sum + b.lessons.length, 0);

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] pb-24">
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

      <div className="p-4">
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
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[var(--tg-theme-text-color)]">
                Структура курса
              </h2>
              <span className="text-xs text-[var(--tg-theme-hint-color)]">
                {blocks.length} блоков • {totalLessons} уроков
              </span>
            </div>

            {/* Список блоков с drag-n-drop */}
            {blocks.length > 0 && (
              <SortableList
                items={blocks}
                onReorder={handleBlocksReorder}
                renderItem={(block, blockIndex) => (
                  <Card padding="sm" className="bg-[var(--tg-theme-secondary-bg-color)]">
                    {/* Block Header */}
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleBlockExpanded(block.id)}
                      >
                        <span className="text-lg">📂</span>
                        {editingBlockId === block.id ? (
                          <input
                            className="flex-1 bg-transparent border-b border-[var(--tg-theme-button-color)] outline-none text-[var(--tg-theme-text-color)]"
                            value={editBlockTitle}
                            onChange={(e) => setEditBlockTitle(e.target.value)}
                            onKeyDown={handleEditBlockKeyDown}
                            onBlur={saveBlockTitle}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="font-medium text-[var(--tg-theme-text-color)] truncate">
                            {blockIndex + 1}. {block.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[var(--tg-theme-hint-color)] mr-2">
                          {block.lessons.length} уроков
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditBlock(block); }}
                          className="p-1.5 text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)]"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                          className="p-1.5 text-[var(--tg-theme-hint-color)] hover:text-red-500"
                        >
                          🗑️
                        </button>
                        <span className="text-[var(--tg-theme-hint-color)] ml-1">
                          {expandedBlocks.has(block.id) ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>

                    {/* Block Content (Lessons) */}
                    {expandedBlocks.has(block.id) && (
                      <div className="mt-3 pt-3 border-t border-[var(--tg-theme-hint-color)]/20">
                        {block.lessons.length > 0 ? (
                          <SortableList
                            items={block.lessons}
                            onReorder={(reordered) => handleLessonsReorder(block.id, reordered)}
                            renderItem={(lesson, lessonIndex) => (
                              <div
                                className="flex items-center gap-2 py-2 px-2 bg-[var(--tg-theme-bg-color)] rounded-lg cursor-pointer hover:bg-[var(--tg-theme-hint-color)]/5"
                                onClick={() => openEditLesson(lesson, block.id)}
                              >
                                <span className="text-xs text-[var(--tg-theme-hint-color)] w-8">
                                  {blockIndex + 1}.{lessonIndex + 1}
                                </span>
                                <span className="text-sm text-[var(--tg-theme-text-color)] flex-1 truncate">
                                  {lesson.title}
                                </span>
                                {lesson.videoType && (
                                  <span className="text-xs">
                                    {lesson.videoType === 'telegram' ? '🎬' : '🔗'}
                                  </span>
                                )}
                                <button
                                  onClick={(e) => removeLesson(e, block.id, lesson.id)}
                                  className="p-1.5 text-[var(--tg-theme-hint-color)] hover:text-red-500 text-sm"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          />
                        ) : (
                          <p className="text-xs text-[var(--tg-theme-hint-color)] text-center py-2">
                            Пока нет уроков
                          </p>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={(e) => { e.stopPropagation(); openCreateLesson(block.id); }}
                        >
                          + Добавить урок
                        </Button>
                      </div>
                    )}
                  </Card>
                )}
              />
            )}

            {/* Кнопка добавления блока */}
            <button
              onClick={openAddBlockModal}
              className="w-full p-4 border-2 border-dashed border-[var(--tg-theme-hint-color)]/30 rounded-xl flex items-center justify-center gap-2 text-[var(--tg-theme-button-color)] hover:border-[var(--tg-theme-button-color)]/50 hover:bg-[var(--tg-theme-button-color)]/5 transition-colors"
            >
              <span className="text-xl">+</span>
              <span className="font-medium">Добавить блок</span>
            </button>

            {blocks.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-[var(--tg-theme-hint-color)]">
                  Нажмите кнопку выше, чтобы добавить первый блок
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - адаптивный */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--tg-theme-bg-color)] border-t border-[var(--tg-theme-hint-color)]/20 z-40">
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
              ←
            </Button>
            <Button
              fullWidth
              onClick={handleCreate}
              loading={isCreating}
            >
              ✓ Создать курс
            </Button>
          </div>
        )}
      </div>

      {/* Add Block Modal */}
      <Modal
        isOpen={addBlockModalOpen}
        onClose={() => setAddBlockModalOpen(false)}
        title="📂 Новый блок"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Название блока *"
            placeholder="Введение"
            value={newBlockTitle}
            onChange={(e) => setNewBlockTitle(e.target.value)}
            onKeyDown={handleBlockKeyDown}
            autoFocus
          />
          <Button
            fullWidth
            onClick={addBlock}
            disabled={!newBlockTitle.trim()}
          >
            Создать блок
          </Button>
        </div>
      </Modal>

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
              onClick={saveLesson}
              disabled={!lessonForm.title.trim()}
            >
              {editingLesson ? 'Сохранить изменения' : 'Создать урок'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
