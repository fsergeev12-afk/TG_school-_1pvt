import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCourse, useCreateBlock, useCreateLesson, useUploadMaterial, useAddMaterial } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Button, Card, Input, Modal, SortableList } from '../../components/ui';
import { useUIStore } from '../../store';

interface FileDraft {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

interface LessonDraft {
  id: string;
  title: string;
  description?: string;
  videoType?: 'telegram' | 'external' | null;
  videoUrl?: string;
  files?: FileDraft[];
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
  const uploadMaterial = useUploadMaterial();
  const addMaterial = useAddMaterial();
  const { showToast } = useUIStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [lessonFiles, setLessonFiles] = useState<FileDraft[]>([]);

  // Модалка просмотра файла
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileDraft | null>(null);

  // Модалки подтверждения удаления
  const [deleteBlockConfirm, setDeleteBlockConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deleteLessonConfirm, setDeleteLessonConfirm] = useState<{ blockId: string; lessonId: string; title: string } | null>(null);

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

  const confirmDeleteBlock = (block: BlockDraft) => {
    setDeleteBlockConfirm({ id: block.id, title: block.title });
  };

  const removeBlock = () => {
    if (!deleteBlockConfirm) return;
    setBlocks(blocks.filter((b) => b.id !== deleteBlockConfirm.id));
    setDeleteBlockConfirm(null);
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
    setLessonFiles([]);
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
    setLessonFiles(lesson.files || []);
    setLessonModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Разрешены только PDF, DOC, DOCX', 'error');
      return;
    }

    // Проверка размера (20MB)
    if (file.size > 20 * 1024 * 1024) {
      showToast('Файл слишком большой (макс 20MB)', 'error');
      return;
    }

    const newFile: FileDraft = {
      id: `file-${Date.now()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.name.split('.').pop() || 'pdf',
    };

    setLessonFiles([...lessonFiles, newFile]);

    // Сбросить input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setLessonFiles(lessonFiles.filter(f => f.id !== fileId));
  };

  const openFilePreview = (fileDraft: FileDraft) => {
    setSelectedFile(fileDraft);
    setFilePreviewOpen(true);
  };

  const handleViewLocalFile = () => {
    if (!selectedFile) return;
    
    // Создаём URL для локального файла
    const fileUrl = URL.createObjectURL(selectedFile.file);
    
    // Для PDF и документов открываем в новом окне
    window.open(fileUrl, '_blank');
    
    // Очищаем URL после небольшой задержки
    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  };

  const handleDownloadLocalFile = () => {
    if (!selectedFile) return;
    
    // Создаём URL и скачиваем
    const fileUrl = URL.createObjectURL(selectedFile.file);
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(fileUrl);
    showToast('Файл скачан!', 'success');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const saveLesson = () => {
    if (!lessonForm.title.trim() || !lessonBlockId) return;

    const lessonData: LessonDraft = {
      id: editingLesson?.id || `temp-${Date.now()}`,
      title: lessonForm.title.trim(),
      description: lessonForm.description.trim() || undefined,
      videoType: lessonForm.videoType,
      videoUrl: lessonForm.videoUrl.trim() || undefined,
      files: lessonFiles,
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

  const confirmDeleteLesson = (e: React.MouseEvent, blockId: string, lesson: LessonDraft) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteLessonConfirm({ blockId, lessonId: lesson.id, title: lesson.title });
  };

  const removeLesson = () => {
    if (!deleteLessonConfirm) return;
    setBlocks(blocks.map(block =>
      block.id === deleteLessonConfirm.blockId
        ? { ...block, lessons: block.lessons.filter(l => l.id !== deleteLessonConfirm.lessonId) }
        : block
    ));
    setDeleteLessonConfirm(null);
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
          const lesson = await createLesson.mutateAsync({
            blockId: block.id,
            title: lessonDraft.title,
            description: lessonDraft.description,
            videoType: lessonDraft.videoType || undefined,
            videoUrl: lessonDraft.videoUrl,
          });

          // Загружаем файлы для урока
          if (lessonDraft.files && lessonDraft.files.length > 0) {
            for (const fileDraft of lessonDraft.files) {
              try {
                const uploadResult = await uploadMaterial.mutateAsync(fileDraft.file);
                await addMaterial.mutateAsync({
                  lessonId: lesson.id,
                  fileId: uploadResult.fileId,
                  fileName: uploadResult.fileName,
                  fileType: fileDraft.type,
                  fileSizeBytes: uploadResult.fileSize,
                });
              } catch {
                console.error('Error uploading file:', fileDraft.name);
              }
            }
          }
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
                          onClick={(e) => { e.stopPropagation(); confirmDeleteBlock(block); }}
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
                                  onClick={(e) => confirmDeleteLesson(e, block.id, lesson)}
                                  className="p-1.5 text-[var(--tg-theme-hint-color)] hover:text-red-500"
                                >
                                  🗑️
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

          {/* Документы */}
          <div>
            <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
              📄 Документы
            </label>
            
            {/* Список файлов */}
            {lessonFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                {lessonFiles.map((fileDraft) => (
                  <div
                    key={fileDraft.id}
                    className="flex items-center gap-2 p-2 bg-[var(--tg-theme-secondary-bg-color)] rounded-lg cursor-pointer hover:bg-[var(--tg-theme-hint-color)]/10 transition-colors"
                    onClick={() => openFilePreview(fileDraft)}
                  >
                    <span className="text-lg">
                      {fileDraft.type === 'pdf' ? '📕' : '📄'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--tg-theme-text-color)] truncate">
                        {fileDraft.name}
                      </p>
                      <p className="text-xs text-[var(--tg-theme-hint-color)]">
                        {formatFileSize(fileDraft.size)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileDraft.id);
                      }}
                      className="p-1 text-[var(--tg-theme-hint-color)] hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Кнопка загрузки */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 border-2 border-dashed border-[var(--tg-theme-hint-color)]/30 rounded-xl flex items-center justify-center gap-2 text-[var(--tg-theme-hint-color)] hover:border-[var(--tg-theme-button-color)]/50 hover:text-[var(--tg-theme-button-color)] transition-colors"
            >
              <span className="text-lg">📤</span>
              <span className="text-sm">Добавить документ</span>
            </button>
            <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1 text-center">
              PDF, DOC, DOCX • до 20MB
            </p>
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

      {/* File Preview Modal */}
      <Modal
        isOpen={filePreviewOpen}
        onClose={() => {
          setFilePreviewOpen(false);
          setSelectedFile(null);
        }}
        title="📄 Документ"
        size="sm"
      >
        {selectedFile && (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center gap-3 p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl">
              <span className="text-3xl">
                {selectedFile.type === 'pdf' ? '📕' : '📄'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--tg-theme-text-color)] font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                fullWidth
                onClick={handleViewLocalFile}
              >
                👁️ Посмотреть
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={handleDownloadLocalFile}
              >
                ⬇️ Скачать
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Block Confirmation Modal */}
      <Modal
        isOpen={!!deleteBlockConfirm}
        onClose={() => setDeleteBlockConfirm(null)}
        title="🗑️ Удалить блок?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[var(--tg-theme-text-color)]">
            Вы уверены, что хотите удалить блок <strong>"{deleteBlockConfirm?.title}"</strong>?
          </p>
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Все уроки в этом блоке также будут удалены.
          </p>
          <div className="flex gap-2">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setDeleteBlockConfirm(null)}
            >
              Отмена
            </Button>
            <Button
              fullWidth
              className="bg-red-500 hover:bg-red-600"
              onClick={removeBlock}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Lesson Confirmation Modal */}
      <Modal
        isOpen={!!deleteLessonConfirm}
        onClose={() => setDeleteLessonConfirm(null)}
        title="🗑️ Удалить урок?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[var(--tg-theme-text-color)]">
            Вы уверены, что хотите удалить урок <strong>"{deleteLessonConfirm?.title}"</strong>?
          </p>
          <div className="flex gap-2">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setDeleteLessonConfirm(null)}
            >
              Отмена
            </Button>
            <Button
              fullWidth
              className="bg-red-500 hover:bg-red-600"
              onClick={removeLesson}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
