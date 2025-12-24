import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  useCourse, 
  useCreateBlock,
  useUpdateBlock,
  useCreateLesson, 
  useUpdateLesson, 
  useReorderBlocks,
  useReorderLessons,
  useDeleteBlock,
  useDeleteLesson,
  useLessonMaterials,
  useUploadMaterial,
  useAddMaterial,
  useDeleteMaterial,
  useGetFileUrl,
  LessonMaterial,
} from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Card, Button, Input, Modal, SortableList } from '../../components/ui';
import { useUIStore } from '../../store';
import { Block, Lesson } from '../../types';

type VideoType = 'telegram' | 'external' | null;

interface LessonFormData {
  title: string;
  description: string;
  videoType: VideoType;
  videoUrl: string;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: course, isLoading } = useCourse(id!);
  const createBlock = useCreateBlock();
  const updateBlock = useUpdateBlock();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const reorderBlocks = useReorderBlocks();
  const reorderLessons = useReorderLessons();
  const deleteBlock = useDeleteBlock();
  const deleteLesson = useDeleteLesson();
  const uploadMaterial = useUploadMaterial();
  const addMaterial = useAddMaterial();
  const deleteMaterial = useDeleteMaterial();
  const getFileUrl = useGetFileUrl();
  const { showToast } = useUIStore();

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File preview modal
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<LessonMaterial | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadingFileUrl, setLoadingFileUrl] = useState(false);

  // Block modal
  const [addBlockModalOpen, setAddBlockModalOpen] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');

  // Block editing
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editBlockTitle, setEditBlockTitle] = useState('');

  // Expanded blocks
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

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

  // Delete confirmation
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  const toggleBlockExpanded = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId);
    } else {
      newExpanded.add(blockId);
    }
    setExpandedBlocks(newExpanded);
  };

  const openAddBlockModal = () => {
    setNewBlockTitle('');
    setAddBlockModalOpen(true);
  };

  const handleAddBlock = async () => {
    if (!newBlockTitle.trim() || !id) return;
    try {
      const block = await createBlock.mutateAsync({ courseId: id, title: newBlockTitle.trim() });
      setNewBlockTitle('');
      setAddBlockModalOpen(false);
      setExpandedBlocks(new Set([...expandedBlocks, block.id]));
      showToast('Блок добавлен!', 'success');
    } catch {
      showToast('Ошибка добавления блока', 'error');
    }
  };

  const handleBlockKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBlock();
    }
  };

  const startEditBlock = (block: Block) => {
    setEditingBlockId(block.id);
    setEditBlockTitle(block.title);
  };

  const handleSaveBlockTitle = async () => {
    if (!editingBlockId || !editBlockTitle.trim()) return;
    try {
      await updateBlock.mutateAsync({ id: editingBlockId, title: editBlockTitle.trim() });
      setEditingBlockId(null);
      setEditBlockTitle('');
      showToast('Блок обновлён!', 'success');
    } catch {
      showToast('Ошибка обновления блока', 'error');
    }
  };

  const handleEditBlockKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveBlockTitle();
    } else if (e.key === 'Escape') {
      setEditingBlockId(null);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await deleteBlock.mutateAsync(blockId);
      setDeletingBlockId(null);
      showToast('Блок удалён', 'success');
    } catch {
      showToast('Ошибка удаления блока', 'error');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await deleteLesson.mutateAsync(lessonId);
      setDeletingLessonId(null);
      showToast('Урок удалён', 'success');
    } catch {
      showToast('Ошибка удаления урока', 'error');
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
        await updateLesson.mutateAsync({
          id: editingLesson.id,
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim() || undefined,
          videoType: lessonForm.videoType || undefined,
          videoUrl: lessonForm.videoUrl.trim() || undefined,
        });
        showToast('Урок обновлён!', 'success');
      } else if (lessonBlockId) {
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

  // Materials
  const { data: materials, refetch: refetchMaterials } = useLessonMaterials(editingLesson?.id || '');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLesson) return;

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

    try {
      // 1. Загружаем файл
      const uploadResult = await uploadMaterial.mutateAsync(file);
      
      // 2. Привязываем к уроку
      await addMaterial.mutateAsync({
        lessonId: editingLesson.id,
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        fileType: file.name.split('.').pop() || 'pdf',
        fileSizeBytes: uploadResult.fileSize,
      });

      showToast('Документ загружен!', 'success');
      refetchMaterials();
    } catch {
      showToast('Ошибка загрузки документа', 'error');
    }

    // Сбросить input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteMaterial = async (material: LessonMaterial) => {
    if (!editingLesson) return;
    try {
      await deleteMaterial.mutateAsync({
        lessonId: editingLesson.id,
        materialId: material.id,
      });
      showToast('Документ удалён', 'success');
      refetchMaterials();
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  // File preview
  const openFilePreview = async (material: LessonMaterial) => {
    setSelectedMaterial(material);
    setFileUrl(null);
    setFilePreviewOpen(true);
    setLoadingFileUrl(true);
    
    try {
      const url = await getFileUrl.mutateAsync(material.telegramFileId);
      setFileUrl(url);
    } catch {
      showToast('Не удалось получить файл', 'error');
    } finally {
      setLoadingFileUrl(false);
    }
  };

  const handleViewFile = () => {
    if (!fileUrl || !selectedMaterial) return;
    
    // Для PDF используем Google Docs Viewer для корректного просмотра
    if (selectedMaterial.fileType === 'pdf') {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      window.open(viewerUrl, '_blank');
    } else {
      // Для DOC/DOCX тоже используем Google Docs Viewer
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      window.open(viewerUrl, '_blank');
    }
  };

  const handleDownloadFile = () => {
    if (!fileUrl || !selectedMaterial) return;
    
    // Создаём ссылку для скачивания
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = selectedMaterial.fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Скачивание началось', 'success');
  };

  const handleBlocksReorder = async (reorderedBlocks: Block[]) => {
    if (!id) return;
    try {
      await reorderBlocks.mutateAsync({
        courseId: id,
        orderedIds: reorderedBlocks.map(b => b.id),
      });
    } catch {
      showToast('Ошибка сортировки', 'error');
    }
  };

  const handleLessonsReorder = async (blockId: string, reorderedLessons: Lesson[]) => {
    try {
      await reorderLessons.mutateAsync({
        blockId,
        orderedIds: reorderedLessons.map(l => l.id),
      });
    } catch {
      showToast('Ошибка сортировки', 'error');
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
  const blocks = course.blocks || [];

  return (
    <div className="pb-24">
      <PageHeader
        title="Редактирование курса"
        subtitle={course.title}
        showBack
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
                {blocks.length} блоков • {totalLessons} уроков
              </p>
              {course.description && (
                <p className="text-sm text-[var(--tg-theme-text-color)] mt-1 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        </Card>


        {/* Структура курса */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[var(--tg-theme-text-color)]">
              Структура курса
            </h2>
            <span className="text-xs text-[var(--tg-theme-hint-color)]">
              ⋮⋮ перетащите для сортировки
            </span>
          </div>

          {blocks.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-[var(--tg-theme-hint-color)]">
                Нажмите кнопку ниже, чтобы добавить блок
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <SortableList
                items={blocks}
                onReorder={handleBlocksReorder}
                renderItem={(block, blockIndex) => (
                  <Card padding="sm" className="bg-[var(--tg-theme-secondary-bg-color)]">
                    {/* Block Header */}
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleBlockExpanded(block.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">📂</span>
                        {editingBlockId === block.id ? (
                          <input
                            className="flex-1 bg-transparent border-b border-[var(--tg-theme-button-color)] outline-none text-[var(--tg-theme-text-color)]"
                            value={editBlockTitle}
                            onChange={(e) => setEditBlockTitle(e.target.value)}
                            onKeyDown={handleEditBlockKeyDown}
                            onBlur={handleSaveBlockTitle}
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
                          {block.lessons?.length || 0} уроков
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditBlock(block); }}
                          className="p-1.5 text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)]"
                        >
                          ✏️
                        </button>
                        {deletingBlockId === block.id ? (
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-xs px-2 py-1"
                              onClick={() => handleDeleteBlock(block.id)}
                              loading={deleteBlock.isPending}
                            >
                              Да
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs px-2 py-1"
                              onClick={() => setDeletingBlockId(null)}
                            >
                              Нет
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingBlockId(block.id);
                            }}
                            className="text-[var(--tg-theme-hint-color)] hover:text-red-500 p-1.5"
                          >
                            🗑️
                          </button>
                        )}
                        <span className="text-[var(--tg-theme-hint-color)] ml-1">
                          {expandedBlocks.has(block.id) ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>

                    {/* Block Content (Lessons) */}
                    {expandedBlocks.has(block.id) && (
                      <div className="mt-3 pt-3 border-t border-[var(--tg-theme-hint-color)]/20">
                        {block.lessons && block.lessons.length > 0 ? (
                          <SortableList
                            items={block.lessons}
                            onReorder={(reordered) => handleLessonsReorder(block.id, reordered)}
                            renderItem={(lesson, lessonIndex) => (
                              <div
                                className="flex items-center gap-2 py-2 px-2 bg-[var(--tg-theme-bg-color)] rounded-lg cursor-pointer hover:bg-[var(--tg-theme-hint-color)]/5 transition-colors"
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
                                {deletingLessonId === lesson.id ? (
                                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleDeleteLesson(lesson.id)}
                                      className="text-xs text-red-500 px-1"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setDeletingLessonId(null)}
                                      className="text-xs text-[var(--tg-theme-hint-color)] px-1"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingLessonId(lesson.id);
                                    }}
                                    className="text-[var(--tg-theme-hint-color)] hover:text-red-500 p-1.5 text-sm"
                                  >
                                    ✕
                                  </button>
                                )}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateLesson(block.id);
                          }}
                        >
                          + Добавить урок
                        </Button>
                      </div>
                    )}
                  </Card>
                )}
              />
            </div>
          )}

          {/* Кнопка добавления блока */}
          <button
            onClick={openAddBlockModal}
            className="w-full mt-4 p-4 border-2 border-dashed border-[var(--tg-theme-hint-color)]/30 rounded-xl flex items-center justify-center gap-2 text-[var(--tg-theme-button-color)] hover:border-[var(--tg-theme-button-color)]/50 hover:bg-[var(--tg-theme-button-color)]/5 transition-colors"
          >
            <span className="text-xl">+</span>
            <span className="font-medium">Добавить блок</span>
          </button>
        </div>
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
            onClick={handleAddBlock}
            disabled={!newBlockTitle.trim()}
            loading={createBlock.isPending}
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

          {/* Материалы (только при редактировании) */}
          {editingLesson && (
            <div>
              <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
                📄 Документы
              </label>
              
              {/* Список загруженных материалов */}
              {materials && materials.length > 0 && (
                <div className="space-y-2 mb-3">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center gap-2 p-2 bg-[var(--tg-theme-secondary-bg-color)] rounded-lg cursor-pointer hover:bg-[var(--tg-theme-hint-color)]/10 transition-colors"
                      onClick={() => openFilePreview(material)}
                    >
                      <span className="text-lg">
                        {material.fileType === 'pdf' ? '📕' : '📄'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--tg-theme-text-color)] truncate">
                          {material.fileName}
                        </p>
                        <p className="text-xs text-[var(--tg-theme-hint-color)]">
                          {formatFileSize(material.fileSizeBytes)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMaterial(material);
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
                disabled={uploadMaterial.isPending || addMaterial.isPending}
                className="w-full p-3 border-2 border-dashed border-[var(--tg-theme-hint-color)]/30 rounded-xl flex items-center justify-center gap-2 text-[var(--tg-theme-hint-color)] hover:border-[var(--tg-theme-button-color)]/50 hover:text-[var(--tg-theme-button-color)] transition-colors disabled:opacity-50"
              >
                {uploadMaterial.isPending || addMaterial.isPending ? (
                  <>Загрузка...</>
                ) : (
                  <>
                    <span className="text-lg">📤</span>
                    <span className="text-sm">Добавить документ</span>
                  </>
                )}
              </button>
              <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1 text-center">
                PDF, DOC, DOCX • до 20MB
              </p>
            </div>
          )}

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

      {/* File Preview Modal */}
      <Modal
        isOpen={filePreviewOpen}
        onClose={() => {
          setFilePreviewOpen(false);
          setSelectedMaterial(null);
          setFileUrl(null);
        }}
        title="📄 Документ"
        size="sm"
      >
        {selectedMaterial && (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center gap-3 p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl">
              <span className="text-3xl">
                {selectedMaterial.fileType === 'pdf' ? '📕' : '📄'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--tg-theme-text-color)] font-medium truncate">
                  {selectedMaterial.fileName}
                </p>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">
                  {formatFileSize(selectedMaterial.fileSizeBytes)} • {selectedMaterial.fileType.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Loading state */}
            {loadingFileUrl && (
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--tg-theme-button-color)] border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-[var(--tg-theme-hint-color)] mt-2">Загрузка файла...</p>
              </div>
            )}

            {/* Actions */}
            {fileUrl && !loadingFileUrl && (
              <div className="space-y-2">
                <Button
                  fullWidth
                  onClick={handleViewFile}
                >
                  👁️ Посмотреть
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={handleDownloadFile}
                >
                  ⬇️ Скачать
                </Button>
              </div>
            )}

            {/* Error state */}
            {!fileUrl && !loadingFileUrl && (
              <p className="text-center text-[var(--tg-theme-hint-color)]">
                Не удалось загрузить файл
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
