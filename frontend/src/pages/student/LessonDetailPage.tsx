import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/ui';

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // TODO: Получить данные урока
  // const { data: lesson } = useLesson(id!);

  // Моковые данные
  const lesson = {
    id,
    title: 'Основы работы',
    description: 'В этом уроке вы узнаете основные принципы работы с платформой. Мы разберём ключевые концепции и научимся применять их на практике.',
    videoType: 'external' as const,
    videoExternalUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    materials: [
      { id: '1', fileName: 'Презентация урока.pdf', fileType: 'pdf' as const, fileSizeBytes: 2500000 },
      { id: '2', fileName: 'Дополнительные материалы.pdf', fileType: 'pdf' as const, fileSizeBytes: 1200000 },
    ],
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      <PageHeader
        title={lesson.title}
        showBack
      />

      <div className="p-4 space-y-4">
        {/* Видео */}
        {lesson.videoType === 'external' && lesson.videoExternalUrl && (
          <div className="aspect-video rounded-2xl overflow-hidden bg-black">
            <iframe
              src={lesson.videoExternalUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}

        {lesson.videoType === 'telegram' && (
          <Card className="aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-[var(--tg-theme-hint-color)]">
                Видео загружено в Telegram
              </p>
              <Button className="mt-3">Смотреть видео</Button>
            </div>
          </Card>
        )}

        {/* Описание */}
        {lesson.description && (
          <Card>
            <h3 className="font-semibold text-[var(--tg-theme-text-color)] mb-2">
              Описание
            </h3>
            <p className="text-[var(--tg-theme-text-color)] whitespace-pre-wrap">
              {lesson.description}
            </p>
          </Card>
        )}

        {/* Материалы */}
        {lesson.materials.length > 0 && (
          <Card>
            <h3 className="font-semibold text-[var(--tg-theme-text-color)] mb-3">
              Материалы
            </h3>
            <div className="space-y-2">
              {lesson.materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center gap-3 p-3 bg-[var(--tg-theme-bg-color)] rounded-xl"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-xs font-bold">
                      {material.fileType.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--tg-theme-text-color)] truncate">
                      {material.fileName}
                    </p>
                    <p className="text-sm text-[var(--tg-theme-hint-color)]">
                      {formatFileSize(material.fileSizeBytes)}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Навигация */}
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => navigate(-1)}>
            ← Назад
          </Button>
          <Button fullWidth>
            Следующий урок →
          </Button>
        </div>
      </div>
    </div>
  );
}

