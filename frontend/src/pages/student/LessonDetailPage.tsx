import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer, PageContent, PageHeader } from '../../components/layout';
import { Card, Button, Icons } from '../../components/ui';
import { useStudentLesson, useGetFileUrl } from '../../api/hooks';

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lesson, isLoading } = useStudentLesson(id);
  const getFileUrl = useGetFileUrl();
  const [materialsExpanded, setMaterialsExpanded] = useState(false);

  const handleOpenVideo = () => {
    if (lesson?.videoType === 'external' && lesson?.videoExternalUrl) {
      // Для YouTube - открыть в новой вкладке
      const url = lesson.videoExternalUrl.includes('embed') 
        ? lesson.videoExternalUrl.replace('/embed/', '/watch?v=')
        : lesson.videoExternalUrl;
      window.open(url, '_blank');
    } else if (lesson?.videoType === 'telegram' && lesson?.videoTelegramFileId) {
      // TODO: Реализовать воспроизведение Telegram видео
      alert('Видео загружено через Telegram');
    }
  };

  const handleViewMaterial = async (telegramFileId: string | undefined, fileName: string) => {
    if (!telegramFileId) return;
    
    try {
      const url = await getFileUrl.mutateAsync(telegramFileId);
      if (url) {
        // Открыть через Google Docs Viewer
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        window.open(viewerUrl, '_blank');
      }
    } catch {
      alert(`Не удалось открыть файл: ${fileName}`);
    }
  };

  const handleDownloadMaterial = async (telegramFileId: string | undefined, fileName: string) => {
    if (!telegramFileId) return;
    
    try {
      const url = await getFileUrl.mutateAsync(telegramFileId);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      alert(`Не удалось скачать файл: ${fileName}`);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-secondary text-[15px]">Загрузка...</div>
        </div>
      </PageContainer>
    );
  }

  if (!lesson) {
    return (
      <PageContainer>
        <PageHeader title="Материал" showBack />
        <PageContent>
          <Card variant="normal" className="text-center py-8">
            <p className="text-secondary">Материал не найден</p>
          </Card>
        </PageContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Назад к проекту"
        showBack
        onBack={() => navigate('/student/lessons')}
      />

      <PageContent className="pb-28">
        {/* Название блока */}
        {lesson.blockTitle && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-[var(--terracotta-main)]/10 flex items-center justify-center">
              <Icons.Book className="w-3 h-3 text-[var(--terracotta-main)]" />
            </div>
            <span className="text-[13px] text-secondary break-words">{lesson.blockTitle}</span>
          </div>
        )}
        
        {/* Заголовок урока */}
        <h1 className="text-[24px] font-bold text-dark break-words mb-4">
          {lesson.title}
        </h1>

        {/* Превью видео */}
        {lesson.videoType && (
          <Card variant="active" className="aspect-video overflow-hidden p-0 mb-4">
            {lesson.videoType === 'external' && lesson.videoExternalUrl ? (
              <iframe
                src={lesson.videoExternalUrl}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[var(--purple-main)]/5">
                <Icons.Video className="w-12 h-12 text-[var(--purple-main)]" />
              </div>
            )}
          </Card>
        )}

        {/* Описание */}
        {lesson.description && (
          <Card variant="normal" className="mb-4">
            <p className="text-[15px] text-dark whitespace-pre-wrap">
              {lesson.description}
            </p>
          </Card>
        )}

        {/* Кнопка "Открыть" */}
        {lesson.videoType && (
          <Button 
            fullWidth 
            size="lg"
            onClick={handleOpenVideo}
            className="mb-4"
          >
            <Icons.Play className="w-5 h-5" />
            Открыть видео
          </Button>
        )}

        {/* Материалы */}
        {lesson.materials && lesson.materials.length > 0 && (
          <Card variant="active" className="p-0 overflow-hidden">
            <button
              onClick={() => setMaterialsExpanded(!materialsExpanded)}
              className="w-full flex items-center justify-between p-4 text-left active:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Icons.Paperclip className="w-5 h-5 text-[var(--purple-main)]" />
                <span className="text-[16px] font-semibold text-dark">
                  Файлы ({lesson.materials.length})
                </span>
              </div>
              <Icons.ArrowRight 
                className={`w-5 h-5 text-secondary transition-transform ${materialsExpanded ? 'rotate-90' : ''}`}
              />
            </button>

            {materialsExpanded && (
              <div className="border-t border-[var(--purple-main)]/10">
                {lesson.materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-3 p-4 border-b border-[var(--purple-main)]/10 last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--error)]/10 flex items-center justify-center flex-shrink-0">
                      <Icons.Document className="w-5 h-5 text-[var(--error)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-dark break-words">
                        {material.fileName}
                      </p>
                      <p className="text-[12px] text-secondary">
                        {material.fileType.toUpperCase()} · {(material.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewMaterial(material.telegramFileId, material.fileName)}
                        className="p-2 rounded-lg bg-[var(--purple-main)]/10 text-[var(--purple-main)] active:opacity-70"
                        title="Посмотреть"
                      >
                        <Icons.Search className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadMaterial(material.telegramFileId, material.fileName)}
                        className="p-2 rounded-lg bg-[var(--purple-main)]/10 text-[var(--purple-main)] active:opacity-70"
                        title="Скачать"
                      >
                        <Icons.Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </PageContent>

      {/* Навигация внизу */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-desert-sunset border-t border-[var(--purple-main)]/10 z-40">
        <div className="flex gap-3">
          <Button 
            variant="secondary"
            size="md"
            onClick={() => lesson.prevLessonId ? navigate(`/student/lessons/${lesson.prevLessonId}`) : navigate('/student/lessons')}
            className="flex-1"
            disabled={!lesson.prevLessonId}
          >
            <Icons.ArrowLeft className="w-4 h-4" />
            Предыдущий
          </Button>
          <Button
            size="md"
            onClick={() => lesson.nextLessonId ? navigate(`/student/lessons/${lesson.nextLessonId}`) : navigate('/student/lessons')}
            className="flex-1"
            disabled={!lesson.nextLessonId}
          >
            Следующий
            <Icons.ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
