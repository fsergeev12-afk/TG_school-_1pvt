import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/ui';
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

  const handleAskQuestion = () => {
    window.open('https://t.me/TG_school_1pvt_bot', '_blank');
  };

  const handleViewMaterial = async (telegramFileId: string | undefined, fileName: string) => {
    if (!telegramFileId) return;
    
    try {
      const result = await getFileUrl.mutateAsync(telegramFileId);
      if (result.url) {
        // Открыть через Google Docs Viewer
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(result.url)}&embedded=true`;
        window.open(viewerUrl, '_blank');
      }
    } catch {
      alert(`Не удалось открыть файл: ${fileName}`);
    }
  };

  const handleDownloadMaterial = async (telegramFileId: string | undefined, fileName: string) => {
    if (!telegramFileId) return;
    
    try {
      const result = await getFileUrl.mutateAsync(telegramFileId);
      if (result.url) {
        const a = document.createElement('a');
        a.href = result.url;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Урок" showBack />
        <div className="p-4">
          <Card className="text-center py-8">
            <p className="text-[var(--tg-theme-hint-color)]">Урок не найден</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title="Назад к курсу"
        showBack
        onBack={() => navigate('/student/lessons')}
      />

      <div className="p-4 space-y-4">
        {/* Заголовок урока */}
        <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
          {lesson.title}
        </h1>

        {/* Превью видео */}
        {lesson.videoType && (
          <Card className="aspect-video flex items-center justify-center bg-[var(--tg-theme-secondary-bg-color)]">
            {lesson.videoType === 'external' && lesson.videoExternalUrl ? (
              <iframe
                src={lesson.videoExternalUrl}
                className="w-full h-full rounded-xl"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <span className="text-[var(--tg-theme-hint-color)]">[Превью видео]</span>
            )}
          </Card>
        )}

        {/* Описание */}
        {lesson.description && (
          <p className="text-[var(--tg-theme-text-color)]">
            {lesson.description}
          </p>
        )}

        {/* Кнопка "Открыть видео" */}
        {lesson.videoType && (
          <Button 
            fullWidth 
            onClick={handleOpenVideo}
            className="flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Открыть видео
          </Button>
        )}

        {/* Кнопка "Задать вопрос" */}
        <Button 
          fullWidth 
          variant="secondary"
          onClick={handleAskQuestion}
          className="flex items-center justify-center gap-2"
        >
          <span>💬</span>
          Задать вопрос
        </Button>

        {/* Материалы */}
        {lesson.materials && lesson.materials.length > 0 && (
          <div>
            <button
              onClick={() => setMaterialsExpanded(!materialsExpanded)}
              className="flex items-center gap-2 text-[var(--tg-theme-link-color)] py-2"
            >
              <span>📎</span>
              <span>Открыть материалы ({lesson.materials.length})</span>
              <svg 
                className={`w-4 h-4 transition-transform ${materialsExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {materialsExpanded && (
              <div className="mt-2 space-y-2">
                {lesson.materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-3 p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs font-bold">
                        {material.fileType.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--tg-theme-text-color)] truncate text-sm">
                        {material.fileName}
                      </p>
                      <p className="text-xs text-[var(--tg-theme-hint-color)]">
                        {(material.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewMaterial(material.telegramFileId, material.fileName)}
                        className="p-2 text-[var(--tg-theme-link-color)]"
                        title="Посмотреть"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleDownloadMaterial(material.telegramFileId, material.fileName)}
                        className="p-2 text-[var(--tg-theme-link-color)]"
                        title="Скачать"
                      >
                        ⬇️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Навигация внизу */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-[var(--tg-theme-bg-color)] border-t border-[var(--tg-theme-hint-color)]/20">
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => lesson.prevLessonId ? navigate(`/student/lessons/${lesson.prevLessonId}`) : navigate('/student/lessons')}
            className="flex-1"
            disabled={!lesson.prevLessonId}
          >
            ← Предыдущий
          </Button>
          <Button 
            onClick={() => lesson.nextLessonId ? navigate(`/student/lessons/${lesson.nextLessonId}`) : navigate('/student/lessons')}
            className="flex-1"
            disabled={!lesson.nextLessonId}
          >
            Следующий →
          </Button>
        </div>
      </div>
    </div>
  );
}
