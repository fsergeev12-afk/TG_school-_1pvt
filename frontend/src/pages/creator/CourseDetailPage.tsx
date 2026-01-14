import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useCourse, 
  useCreateBlock,
  useUpdateBlock,
  useCreateLesson, 
  useUpdateLesson, 
  useReorderBlocks,
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
import { Card, Button, Input, Modal, SortableList, FullscreenEditor, Icons } from '../../components/ui';
import { useUIStore } from '../../store';

type VideoType = 'telegram' | 'external' | null;

// Local draft types
interface LessonDraft {
  id: string;
  title: string;
  description?: string;
  videoType?: VideoType;
  videoUrl?: string;
  isNew?: boolean; // true if created locally, not yet on server
  isDeleted?: boolean; // true if marked for deletion
  isModified?: boolean; // true if modified
}

interface BlockDraft {
  id: string;
  title: string;
  lessons: LessonDraft[];
  isNew?: boolean;
  isDeleted?: boolean;
  isModified?: boolean;
}

interface LessonFormData {
  title: string;
  description: string;
  videoType: VideoType;
  videoUrl: string;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading, refetch } = useCourse(id!);
  
  // API mutations
  const createBlockMutation = useCreateBlock();
  const updateBlockMutation = useUpdateBlock();
  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();
  const reorderBlocksMutation = useReorderBlocks();
  const deleteBlockMutation = useDeleteBlock();
  const deleteLessonMutation = useDeleteLesson();
  const uploadMaterial = useUploadMaterial();
  const addMaterial = useAddMaterial();
  const deleteMaterial = useDeleteMaterial();
  const getFileUrl = useGetFileUrl();
  const { showToast } = useUIStore();

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LOCAL STATE - all changes happen here first
  const [localBlocks, setLocalBlocks] = useState<BlockDraft[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local state from server data
  useEffect(() => {
    if (course?.blocks) {
      const blocks: BlockDraft[] = course.blocks.map(block => ({
        id: block.id,
        title: block.title,
        lessons: (block.lessons || []).map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          videoType: lesson.videoType as VideoType,
          videoUrl: lesson.videoExternalUrl || lesson.videoUrl,
        })),
      }));
      setLocalBlocks(blocks);
      setHasChanges(false);
    }
  }, [course]);

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
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonBlockId, setLessonBlockId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormData>({
    title: '',
    description: '',
    videoType: null,
    videoUrl: '',
  });

  // Delete confirmation modals
  const [deleteBlockConfirm, setDeleteBlockConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deleteLessonConfirm, setDeleteLessonConfirm] = useState<{ blockId: string; lessonId: string; title: string } | null>(null);

  // Exit confirmation
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  // Mark as changed
  const markChanged = () => {
    setHasChanges(true);
  };

  // ============ BLOCK OPERATIONS (LOCAL) ============
  
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

  const handleAddBlock = () => {
    if (!newBlockTitle.trim()) return;
    
    const newBlock: BlockDraft = {
      id: `new-${Date.now()}`,
      title: newBlockTitle.trim(),
      lessons: [],
      isNew: true,
    };
    
    setLocalBlocks([...localBlocks, newBlock]);
    setExpandedBlocks(new Set([...expandedBlocks, newBlock.id]));
    setNewBlockTitle('');
    setAddBlockModalOpen(false);
    markChanged();
    showToast('Раздел добавлен', 'success');
  };

  const handleBlockKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBlock();
    }
  };

  const startEditBlock = (block: BlockDraft) => {
    setEditingBlockId(block.id);
    setEditBlockTitle(block.title);
  };

  const handleSaveBlockTitle = () => {
    if (!editingBlockId || !editBlockTitle.trim()) return;
    
    setLocalBlocks(localBlocks.map(b => 
      b.id === editingBlockId 
        ? { ...b, title: editBlockTitle.trim(), isModified: !b.isNew }
        : b
    ));
    setEditingBlockId(null);
    setEditBlockTitle('');
    markChanged();
  };

  const handleEditBlockKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveBlockTitle();
    } else if (e.key === 'Escape') {
      setEditingBlockId(null);
    }
  };

  const confirmDeleteBlock = (block: BlockDraft) => {
    setDeleteBlockConfirm({ id: block.id, title: block.title });
  };

  const handleDeleteBlock = () => {
    if (!deleteBlockConfirm) return;
    
    const block = localBlocks.find(b => b.id === deleteBlockConfirm.id);
    if (block?.isNew) {
      // New block - just remove from local state
      setLocalBlocks(localBlocks.filter(b => b.id !== deleteBlockConfirm.id));
    } else {
      // Existing block - mark for deletion
      setLocalBlocks(localBlocks.map(b => 
        b.id === deleteBlockConfirm.id ? { ...b, isDeleted: true } : b
      ));
    }
    
    setDeleteBlockConfirm(null);
    markChanged();
    showToast('Раздел удалён', 'success');
  };

  const handleBlocksReorder = (reorderedBlocks: BlockDraft[]) => {
    setLocalBlocks(reorderedBlocks);
    markChanged();
  };

  // ============ LESSON OPERATIONS (LOCAL) ============

  const openCreateLesson = (blockId: string) => {
    setLessonBlockId(blockId);
    setEditingLessonId(null);
    setLessonForm({ title: '', description: '', videoType: null, videoUrl: '' });
    setLessonModalOpen(true);
  };

  const openEditLesson = (lesson: LessonDraft, blockId: string) => {
    setLessonBlockId(blockId);
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      videoType: lesson.videoType || null,
      videoUrl: lesson.videoUrl || '',
    });
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim() || !lessonBlockId) {
      showToast('Введите название материала', 'error');
      return;
    }

    const block = localBlocks.find(b => b.id === lessonBlockId);
    const isExistingBlock = block && !block.isNew;

    if (editingLessonId) {
      // Update existing lesson
      const lesson = block?.lessons.find(l => l.id === editingLessonId);
      const isExistingLesson = lesson && !lesson.isNew;

      if (isExistingBlock && isExistingLesson) {
        // Сохраняем сразу на сервер для существующего урока
        try {
          await updateLessonMutation.mutateAsync({
            id: editingLessonId,
            title: lessonForm.title.trim(),
            description: lessonForm.description.trim() || undefined,
            videoType: lessonForm.videoType || undefined,
            videoUrl: lessonForm.videoUrl.trim() || undefined,
          });
          await refetch();
          showToast('Материал сохранён!', 'success');
        } catch {
          showToast('Ошибка сохранения', 'error');
        }
      } else {
        // Локальное обновление для нового урока
        setLocalBlocks(localBlocks.map(b => 
          b.id === lessonBlockId
            ? {
                ...b,
                lessons: b.lessons.map(l => 
                  l.id === editingLessonId
                    ? {
                        ...l,
                        title: lessonForm.title.trim(),
                        description: lessonForm.description.trim() || undefined,
                        videoType: lessonForm.videoType,
                        videoUrl: lessonForm.videoUrl.trim() || undefined,
                        isModified: !l.isNew,
                      }
                    : l
                ),
              }
            : b
        ));
        markChanged();
        showToast('Материал обновлён', 'success');
      }
    } else {
      // Create new lesson
      if (isExistingBlock) {
        // Создаём сразу на сервере для существующего блока
        try {
          await createLessonMutation.mutateAsync({
            blockId: lessonBlockId,
            title: lessonForm.title.trim(),
            description: lessonForm.description.trim() || undefined,
            videoType: lessonForm.videoType || undefined,
            videoUrl: lessonForm.videoUrl.trim() || undefined,
          });
          await refetch();
          showToast('Материал создан!', 'success');
        } catch {
          showToast('Ошибка создания', 'error');
        }
      } else {
        // Локальное создание для нового блока
        const newLesson: LessonDraft = {
          id: `new-${Date.now()}`,
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim() || undefined,
          videoType: lessonForm.videoType,
          videoUrl: lessonForm.videoUrl.trim() || undefined,
          isNew: true,
        };
        
        setLocalBlocks(localBlocks.map(b => 
          b.id === lessonBlockId
            ? { ...b, lessons: [...b.lessons, newLesson] }
            : b
        ));
        markChanged();
        showToast('Материал добавлен', 'success');
      }
    }

    setLessonModalOpen(false);
  };

  const confirmDeleteLesson = (blockId: string, lesson: LessonDraft) => {
    setDeleteLessonConfirm({ blockId, lessonId: lesson.id, title: lesson.title });
  };

  const handleDeleteLesson = () => {
    if (!deleteLessonConfirm) return;
    
    setLocalBlocks(localBlocks.map(block => {
      if (block.id !== deleteLessonConfirm.blockId) return block;
      
      const lesson = block.lessons.find(l => l.id === deleteLessonConfirm.lessonId);
      if (lesson?.isNew) {
        // New lesson - just remove
        return { ...block, lessons: block.lessons.filter(l => l.id !== deleteLessonConfirm.lessonId) };
      } else {
        // Existing lesson - mark for deletion
        return {
          ...block,
          lessons: block.lessons.map(l => 
            l.id === deleteLessonConfirm.lessonId ? { ...l, isDeleted: true } : l
          ),
        };
      }
    }));
    
    setDeleteLessonConfirm(null);
    markChanged();
    showToast('Материал удалён', 'success');
  };

  const handleLessonsReorder = (blockId: string, reorderedLessons: LessonDraft[]) => {
    setLocalBlocks(localBlocks.map(block => 
      block.id === blockId ? { ...block, lessons: reorderedLessons } : block
    ));
    markChanged();
  };

  // ============ SAVE ALL CHANGES TO SERVER ============

  const handleSaveAll = async () => {
    if (!id) return;
    
    setIsSaving(true);
    
    try {
      // 1. Delete blocks marked for deletion
      for (const block of localBlocks.filter(b => b.isDeleted && !b.isNew)) {
        await deleteBlockMutation.mutateAsync(block.id);
      }
      
      // 2. Delete lessons marked for deletion
      for (const block of localBlocks.filter(b => !b.isDeleted)) {
        for (const lesson of block.lessons.filter(l => l.isDeleted && !l.isNew)) {
          await deleteLessonMutation.mutateAsync(lesson.id);
        }
      }
      
      // 3. Create new blocks
      const blockIdMap: Record<string, string> = {};
      for (const block of localBlocks.filter(b => b.isNew && !b.isDeleted)) {
        const created = await createBlockMutation.mutateAsync({ courseId: id, title: block.title });
        blockIdMap[block.id] = created.id;
      }
      
      // 4. Update modified blocks
      for (const block of localBlocks.filter(b => b.isModified && !b.isNew && !b.isDeleted)) {
        await updateBlockMutation.mutateAsync({ id: block.id, title: block.title });
      }
      
      // 5. Create new lessons
      for (const block of localBlocks.filter(b => !b.isDeleted)) {
        const actualBlockId = block.isNew ? blockIdMap[block.id] : block.id;
        for (const lesson of block.lessons.filter(l => l.isNew && !l.isDeleted)) {
          await createLessonMutation.mutateAsync({
            blockId: actualBlockId,
            title: lesson.title,
            description: lesson.description,
            videoType: lesson.videoType || undefined,
            videoUrl: lesson.videoUrl,
          });
        }
      }
      
      // 6. Update modified lessons
      for (const block of localBlocks.filter(b => !b.isDeleted && !b.isNew)) {
        for (const lesson of block.lessons.filter(l => l.isModified && !l.isNew && !l.isDeleted)) {
          await updateLessonMutation.mutateAsync({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            videoType: lesson.videoType || undefined,
            videoUrl: lesson.videoUrl,
          });
        }
      }
      
      // 7. Reorder blocks (only existing ones)
      const existingBlockIds = localBlocks
        .filter(b => !b.isDeleted && !b.isNew)
        .map(b => b.id);
      if (existingBlockIds.length > 0) {
        await reorderBlocksMutation.mutateAsync({ courseId: id, orderedIds: existingBlockIds });
      }
      
      // Refresh data from server
      await refetch();
      setHasChanges(false);
      showToast('Изменения сохранены!', 'success');
      
    } catch (error) {
      console.error('Save error:', error);
      showToast('Ошибка сохранения', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ============ MATERIALS ============
  
  const editingLesson = lessonBlockId 
    ? localBlocks.find(b => b.id === lessonBlockId)?.lessons.find(l => l.id === editingLessonId)
    : null;
  
  const serverLessonId = editingLesson && !editingLesson.isNew ? editingLesson.id : '';
  const { data: materials, refetch: refetchMaterials } = useLessonMaterials(serverLessonId);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Если урок не сохранён, сначала сохраним его
    if (!serverLessonId && editingLesson) {
      if (!lessonForm.title.trim()) {
        showToast('Сначала введите название материала', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      showToast('Сохраняю материал...', 'info');
      await handleSaveLesson();
      // После сохранения serverLessonId обновится, но нужно подождать
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Проверяем снова после возможного сохранения
    const currentLesson = lessonBlockId 
      ? localBlocks.find(b => b.id === lessonBlockId)?.lessons.find(l => l.id === editingLessonId)
      : null;
    const currentServerLessonId = currentLesson && !currentLesson.isNew ? currentLesson.id : '';
    
    if (!currentServerLessonId) {
      showToast('Ошибка: не удалось сохранить материал', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Разрешены только PDF, DOC, DOCX', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showToast('Файл слишком большой (макс 20MB)', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const uploadResult = await uploadMaterial.mutateAsync(file);
      await addMaterial.mutateAsync({
        lessonId: currentServerLessonId,
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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteMaterial = async (material: LessonMaterial) => {
    if (!serverLessonId) return;
    try {
      await deleteMaterial.mutateAsync({ lessonId: serverLessonId, materialId: material.id });
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
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    window.open(viewerUrl, '_blank');
  };

  const handleDownloadFile = () => {
    if (!fileUrl || !selectedMaterial) return;
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

  // ============ RENDER ============

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
        <div className="text-[var(--tg-theme-hint-color)]">Проект не найден</div>
      </div>
    );
  }

  // Filter out deleted items for display
  const visibleBlocks = localBlocks.filter(b => !b.isDeleted);
  const totalLessons = visibleBlocks.reduce((sum, b) => sum + b.lessons.filter(l => !l.isDeleted).length, 0);

  return (
    <div className="pb-24">
      <PageHeader
        title="Редактирование проекта"
        subtitle={course.title}
        showBack
        onBack={() => {
          if (hasChanges) {
            setExitConfirmOpen(true);
          } else {
            navigate('/creator/courses');
          }
        }}
      />

      <div className="p-4 space-y-5">
        {/* Информация о проекте */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[var(--terracotta-main)]/10 flex items-center justify-center">
              <Icons.Book className="w-8 h-8 text-[var(--terracotta-main)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-[var(--tg-theme-hint-color)]">
                {visibleBlocks.length} разделов • {totalLessons} материалов
              </p>
              {course.description && (
                <p className="text-sm text-[var(--tg-theme-text-color)] mt-1 line-clamp-2">
                  {course.description}
                </p>
              )}
              {hasChanges && (
                <p className="text-xs text-orange-500 mt-1">● Есть несохранённые изменения</p>
              )}
            </div>
          </div>
        </Card>

        {/* Структура проекта */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[var(--tg-theme-text-color)]">Структура проекта</h2>
            <span className="text-xs text-[var(--tg-theme-hint-color)]">⋮⋮ перетащите для сортировки</span>
          </div>

          {visibleBlocks.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-[var(--tg-theme-hint-color)]">Нажмите кнопку ниже, чтобы добавить раздел</p>
            </Card>
          ) : (
            <div className="space-y-3">
              <SortableList
                items={visibleBlocks}
                onReorder={handleBlocksReorder}
                renderItem={(block, blockIndex) => (
                  <Card padding="sm" className="bg-[var(--tg-theme-secondary-bg-color)]">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleBlockExpanded(block.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icons.Folder className="w-5 h-5 text-[var(--purple-main)]" />
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
                            {block.isNew && <span className="text-xs text-green-500 ml-2">новый</span>}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[var(--tg-theme-hint-color)] mr-2">
                          {block.lessons.filter(l => !l.isDeleted).length} материалов
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditBlock(block); }}
                          className="p-1.5 text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)]"
                        >
                          <Icons.Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); confirmDeleteBlock(block); }}
                          className="p-1.5 text-[var(--tg-theme-hint-color)] hover:text-red-500"
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </button>
                        {/* Accordion стрелка - крупная и понятная */}
                        <div className={`w-6 h-6 flex items-center justify-center transition-transform duration-200 ${expandedBlocks.has(block.id) ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5 text-[var(--tg-theme-hint-color)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {expandedBlocks.has(block.id) && (
                      <div className="mt-3 pt-3 border-t border-[var(--tg-theme-hint-color)]/20">
                        {block.lessons.filter(l => !l.isDeleted).length > 0 ? (
                          <SortableList
                            items={block.lessons.filter(l => !l.isDeleted)}
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
                                  {lesson.isNew && <span className="text-xs text-green-500 ml-2">новый</span>}
                                </span>
                                {lesson.videoType && (
                                  lesson.videoType === 'telegram' 
                                    ? <Icons.Video className="w-3 h-3 text-[var(--purple-main)]" />
                                    : <Icons.Link className="w-3 h-3 text-[var(--purple-main)]" />
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); confirmDeleteLesson(block.id, lesson); }}
                                  className="p-1.5 text-[var(--tg-theme-hint-color)] hover:text-red-500"
                                >
                                  <Icons.Trash className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          />
                        ) : (
                          <p className="text-xs text-[var(--tg-theme-hint-color)] text-center py-2">Пока нет материалов</p>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={(e) => { e.stopPropagation(); openCreateLesson(block.id); }}
                        >
                          <Icons.Plus className="w-4 h-4" />
                          Добавить материал
                        </Button>
                      </div>
                    )}
                  </Card>
                )}
              />
            </div>
          )}

          <button
            onClick={openAddBlockModal}
            className="w-full mt-4 p-5 border-2 border-dashed border-[var(--terracotta-main)]/30 rounded-2xl flex items-center justify-center gap-3 text-[var(--terracotta-main)] hover:border-[var(--terracotta-main)]/60 hover:bg-[var(--terracotta-main)]/5 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--terracotta-main)]/10 flex items-center justify-center">
              <Icons.Plus className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[15px]">Добавить раздел</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--tg-theme-bg-color)] border-t border-[var(--tg-theme-hint-color)]/20 z-40">
        <Button
          fullWidth
          onClick={handleSaveAll}
          loading={isSaving}
          disabled={!hasChanges}
        >
          {hasChanges ? <><Icons.Check className="w-4 h-4" /> Сохранить изменения</> : <><Icons.Check className="w-4 h-4" /> Все изменения сохранены</>}
        </Button>
      </div>

      {/* Add Block Modal */}
      <Modal isOpen={addBlockModalOpen} onClose={() => setAddBlockModalOpen(false)} title="Новый раздел" size="sm">
        <div className="space-y-4">
          <Input
            label="Название раздела *"
            placeholder="Введение"
            value={newBlockTitle}
            onChange={(e) => setNewBlockTitle(e.target.value)}
            onKeyDown={handleBlockKeyDown}
            autoFocus
          />
          <Button fullWidth onClick={handleAddBlock} disabled={!newBlockTitle.trim()}>
            Создать раздел
          </Button>
        </div>
      </Modal>

      {/* Lesson Fullscreen Editor */}
      <FullscreenEditor
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLessonId ? 'Редактировать материал' : 'Новый материал'}
        footer={
          <Button 
            fullWidth 
            onClick={handleSaveLesson} 
            disabled={!lessonForm.title.trim()}
            className="text-lg py-4"
          >
            {editingLessonId ? <><Icons.Check className="w-4 h-4" /> Сохранить материал</> : <><Icons.Plus className="w-4 h-4" /> Создать материал</>}
          </Button>
        }
      >
        <div className="space-y-6">
          <Input
            label="Название *"
            placeholder="Введение в тему"
            value={lessonForm.title}
            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">Описание</label>
            <textarea
              className="w-full p-3 rounded-xl border border-[var(--tg-theme-hint-color)]/30 bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] min-h-[120px] resize-none text-base"
              placeholder="О чём этот урок..."
              value={lessonForm.description}
              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
              maxLength={500}
            />
            <div className="text-right text-xs text-[var(--tg-theme-hint-color)] mt-1">
              {lessonForm.description.length} / 500
            </div>
          </div>

          {/* Ссылка */}
          <div className="pt-4 border-t border-[var(--tg-theme-hint-color)]/20">
            <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-3 flex items-center gap-2"><Icons.Link className="w-4 h-4" /> Ссылка</label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => setLessonForm({ ...lessonForm, videoType: 'telegram', videoUrl: '' })}
                className={`p-4 rounded-xl border-2 text-sm transition-colors ${
                  lessonForm.videoType === 'telegram'
                    ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10'
                    : 'border-[var(--tg-theme-hint-color)]/30'
                }`}
              >
                <div className="flex items-center gap-2 justify-center"><Icons.Video className="w-4 h-4" /> Загрузить файл</div>
                <div className="text-xs text-[var(--tg-theme-hint-color)] mt-1">до 50MB</div>
              </button>
              <button
                onClick={() => setLessonForm({ ...lessonForm, videoType: 'external', videoUrl: '' })}
                className={`p-4 rounded-xl border-2 text-sm transition-colors ${
                  lessonForm.videoType === 'external'
                    ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10'
                    : 'border-[var(--tg-theme-hint-color)]/30'
                }`}
              >
                <div className="flex items-center gap-2 justify-center"><Icons.Link className="w-4 h-4" /> Внешняя ссылка</div>
                <div className="text-xs text-[var(--tg-theme-hint-color)] mt-1">Любой URL</div>
              </button>
            </div>

            {lessonForm.videoType === 'telegram' && (
              <div className="border-2 border-dashed border-[var(--tg-theme-hint-color)]/30 rounded-xl p-6 text-center">
                <Icons.Upload className="w-8 h-8 mx-auto mb-2 text-[var(--purple-main)]" />
                <p className="text-sm text-[var(--tg-theme-hint-color)]">Загрузка видео через Telegram-бота</p>
                <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">Функция в разработке</p>
              </div>
            )}

            {lessonForm.videoType === 'external' && (
              <Input
                placeholder="https://..."
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
              />
            )}

            {lessonForm.videoType && (
              <button
                onClick={() => setLessonForm({ ...lessonForm, videoType: null, videoUrl: '' })}
                className="text-sm text-red-500 mt-3 p-2 flex items-center gap-1"
              >
                <Icons.Close className="w-4 h-4" /> Убрать ссылку
              </button>
            )}
          </div>

          {/* Материалы (только для существующих уроков) */}
          {editingLessonId && !editingLesson?.isNew && (
            <div className="pt-4 border-t border-[var(--tg-theme-hint-color)]/20">
              <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-3 flex items-center gap-2"><Icons.Document className="w-4 h-4" /> Документы</label>
              
              {materials && materials.length > 0 && (
                <div className="space-y-2 mb-4">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center gap-3 p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl cursor-pointer active:opacity-80 transition-opacity"
                      onClick={() => openFilePreview(material)}
                    >
                      <Icons.Document className="w-6 h-6 text-[var(--terracotta-main)]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--tg-theme-text-color)] truncate">{material.fileName}</p>
                        <p className="text-xs text-[var(--tg-theme-hint-color)]">{formatFileSize(material.fileSizeBytes)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(material); }}
                        className="p-2 text-red-500"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileSelect} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMaterial.isPending || addMaterial.isPending}
                className="w-full p-4 border-2 border-dashed border-[var(--tg-theme-hint-color)]/30 rounded-xl flex items-center justify-center gap-2 text-[var(--tg-theme-hint-color)] hover:border-[var(--tg-theme-button-color)]/50 hover:text-[var(--tg-theme-button-color)] transition-colors disabled:opacity-50"
              >
                {uploadMaterial.isPending || addMaterial.isPending ? (
                  <span className="animate-pulse">Загрузка...</span>
                ) : (
                  <>
                    <Icons.Upload className="w-5 h-5" />
                    <span>Добавить документ</span>
                  </>
                )}
              </button>
              <p className="text-xs text-[var(--tg-theme-hint-color)] mt-2 text-center">PDF, DOC, DOCX • до 20MB</p>
            </div>
          )}

          {editingLesson?.isNew && (
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600 text-center flex items-center justify-center gap-2">
                <Icons.Lightbulb className="w-4 h-4" />
                Документы можно добавить после сохранения изменений
              </p>
            </div>
          )}
        </div>
      </FullscreenEditor>

      {/* File Preview Modal */}
      <Modal
        isOpen={filePreviewOpen}
        onClose={() => { setFilePreviewOpen(false); setSelectedMaterial(null); setFileUrl(null); }}
        title="Документ"
        size="sm"
      >
        {selectedMaterial && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl">
              <Icons.Document className="w-8 h-8 text-[var(--terracotta-main)]" />
              <div className="flex-1 min-w-0">
                <p className="text-[var(--tg-theme-text-color)] font-medium truncate">{selectedMaterial.fileName}</p>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">
                  {formatFileSize(selectedMaterial.fileSizeBytes)} • {selectedMaterial.fileType.toUpperCase()}
                </p>
              </div>
            </div>

            {loadingFileUrl && (
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--tg-theme-button-color)] border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-[var(--tg-theme-hint-color)] mt-2">Загрузка файла...</p>
              </div>
            )}

            {fileUrl && !loadingFileUrl && (
              <div className="space-y-2">
                <Button fullWidth onClick={handleViewFile}><Icons.Eye className="w-4 h-4" /> Посмотреть</Button>
                <Button fullWidth variant="secondary" onClick={handleDownloadFile}><Icons.Download className="w-4 h-4" /> Скачать</Button>
              </div>
            )}

            {!fileUrl && !loadingFileUrl && (
              <p className="text-center text-[var(--tg-theme-hint-color)]">Не удалось загрузить файл</p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Block Confirmation - прямой вопрос */}
      <Modal isOpen={!!deleteBlockConfirm} onClose={() => setDeleteBlockConfirm(null)} title={`Удалить «${deleteBlockConfirm?.title}»?`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Все материалы в этом разделе будут удалены.
          </p>
          <div className="flex gap-3">
            <Button type="button" fullWidth variant="secondary" onClick={() => setDeleteBlockConfirm(null)}>Отмена</Button>
            <Button type="button" fullWidth variant="danger" onClick={handleDeleteBlock}>Удалить</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Lesson Confirmation - прямой вопрос */}
      <Modal isOpen={!!deleteLessonConfirm} onClose={() => setDeleteLessonConfirm(null)} title={`Удалить «${deleteLessonConfirm?.title}»?`} size="sm">
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button type="button" fullWidth variant="secondary" onClick={() => setDeleteLessonConfirm(null)}>Отмена</Button>
            <Button type="button" fullWidth variant="danger" onClick={handleDeleteLesson}>Удалить</Button>
          </div>
        </div>
      </Modal>

      {/* Exit Confirmation - сохраняем изменения перед выходом */}
      <Modal isOpen={exitConfirmOpen} onClose={() => setExitConfirmOpen(false)} title="Сохранить изменения?" size="sm">
        <div className="space-y-4">
          <p className="text-[var(--tg-theme-text-color)]">
            У вас есть несохранённые изменения. Сохранить их перед выходом?
          </p>
          <div className="flex gap-2">
            <Button type="button" fullWidth variant="secondary" onClick={() => setExitConfirmOpen(false)}>
              Продолжить редактирование
            </Button>
            <Button 
              type="button" 
              fullWidth 
              onClick={async () => { 
                setExitConfirmOpen(false); 
                await handleSaveAll(); 
                navigate('/creator/courses'); 
              }}
              loading={isSaving}
            >
              Сохранить и выйти
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
