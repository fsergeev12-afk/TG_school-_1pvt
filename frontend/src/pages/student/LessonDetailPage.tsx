import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/ui';

// Моковые данные - заменить на API
const mockLessons: Record<string, {
  id: string;
  title: string;
  description: string;
  videoType: 'external' | 'telegram' | null;
  videoUrl: string | null;
  materials: { id: string; fileName: string; fileType: string }[];
  prevLessonId: string | null;
  nextLessonId: string | null;
}> = {
  '1': {
    id: '1',
    title: 'Почему время — ваш главный ресурс',
    description: 'В этом уроке вы узнаете, почему время — ваш главный ресурс и как его эффективно использовать.',
    videoType: 'external',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    materials: [
      { id: '1', fileName: 'Презентация урока.pdf', fileType: 'pdf' },
    ],
    prevLessonId: null,
    nextLessonId: '2',
  },
  '2': {
    id: '2',
    title: 'Матрица Эйзенхауэра',
    description: 'Разберём знаменитый метод приоритизации задач по срочности и важности.',
    videoType: 'external',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    materials: [
      { id: '2', fileName: 'Шаблон матрицы.pdf', fileType: 'pdf' },
      { id: '3', fileName: 'Примеры заполнения.pdf', fileType: 'pdf' },
    ],
    prevLessonId: '1',
    nextLessonId: '3',
  },
};

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [materialsExpanded, setMaterialsExpanded] = useState(false);

  // TODO: Получить данные урока из API
  const lesson = mockLessons[id || '1'] || mockLessons['1'];

  const handleOpenVideo = () => {
    if (lesson.videoType === 'external' && lesson.videoUrl) {
      // Для YouTube - открыть в новой вкладке или показать iframe
      window.open(lesson.videoUrl.replace('/embed/', '/watch?v='), '_blank');
    } else if (lesson.videoType === 'telegram') {
      // TODO: Получить видео из Telegram
      alert('Видео загружено через Telegram');
    }
  };

  const handleAskQuestion = () => {
    // Редирект в Telegram бота
    window.open('https://t.me/TG_school_1pvt_bot', '_blank');
  };

  const handleDownloadMaterial = (material: { id: string; fileName: string }) => {
    // TODO: Скачать материал
    alert(`Скачивание: ${material.fileName}`);
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title="Назад к курсу"
        showBack
      />

      <div className="p-4 space-y-4">
        {/* Заголовок урока */}
        <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
          Урок {lesson.id}: {lesson.title}
        </h1>

        {/* Превью видео */}
        <Card className="aspect-video flex items-center justify-center bg-[var(--tg-theme-secondary-bg-color)]">
          <span className="text-[var(--tg-theme-hint-color)]">[Превью видео]</span>
        </Card>

        {/* Описание */}
        <p className="text-[var(--tg-theme-text-color)]">
          {lesson.description}
        </p>

        {/* Кнопка "Открыть видео" */}
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

        {/* Материалы (текстовая ссылка как на макете) */}
        {lesson.materials.length > 0 && (
          <div>
            <button
              onClick={() => setMaterialsExpanded(!materialsExpanded)}
              className="flex items-center gap-2 text-[var(--tg-theme-link-color)] py-2"
            >
              <span>📎</span>
              <span>Открыть материалы</span>
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
                  <button
                    key={material.id}
                    onClick={() => handleDownloadMaterial(material)}
                    className="w-full flex items-center gap-3 p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl text-left active:opacity-80"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs font-bold">
                        {material.fileType.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[var(--tg-theme-text-color)] truncate">
                      {material.fileName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Навигация внизу (фиксированная) */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-[var(--tg-theme-bg-color)] border-t border-[var(--tg-theme-hint-color)]/20">
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => lesson.prevLessonId ? navigate(`/student/lessons/${lesson.prevLessonId}`) : navigate('/student/lessons')}
            className="flex-1"
            disabled={!lesson.prevLessonId}
          >
            ← Предыдущий урок
          </Button>
          <Button 
            onClick={() => lesson.nextLessonId ? navigate(`/student/lessons/${lesson.nextLessonId}`) : navigate('/student/lessons')}
            className="flex-1"
            disabled={!lesson.nextLessonId}
          >
            Следующий урок →
          </Button>
        </div>
      </div>
    </div>
  );
}
