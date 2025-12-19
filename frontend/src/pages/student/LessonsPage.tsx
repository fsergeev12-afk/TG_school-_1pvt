import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card } from '../../components/ui';

// Моковые данные для демонстрации
const mockBlocks = [
  {
    id: '1',
    title: 'Введение',
    lessons: [
      { id: '1', title: 'Добро пожаловать', duration: 5, completed: true, available: true },
      { id: '2', title: 'Как проходить курс', duration: 10, completed: true, available: true },
    ],
  },
  {
    id: '2',
    title: 'Основы',
    lessons: [
      { id: '3', title: 'Первые шаги', duration: 15, completed: true, available: true },
      { id: '4', title: 'Основы работы', duration: 15, completed: false, available: true },
      { id: '5', title: 'Продвинутые техники', duration: 20, completed: false, available: false },
    ],
  },
  {
    id: '3',
    title: 'Практика',
    lessons: [
      { id: '6', title: 'Практическое задание', duration: 30, completed: false, available: false },
    ],
  },
];

export default function LessonsPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Уроки" />

      <div className="p-4 space-y-4">
        {mockBlocks.map((block, blockIndex) => (
          <div key={block.id}>
            <h2 className="font-semibold text-[var(--tg-theme-text-color)] mb-2">
              {blockIndex + 1}. {block.title}
            </h2>
            <div className="space-y-2">
              {block.lessons.map((lesson, lessonIndex) => (
                <Card
                  key={lesson.id}
                  padding="sm"
                  onClick={lesson.available ? () => navigate(`/student/lessons/${lesson.id}`) : undefined}
                  className={`
                    ${lesson.available ? 'active:scale-[0.98] transition-transform' : 'opacity-50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Статус */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${lesson.completed 
                        ? 'bg-green-500 text-white' 
                        : lesson.available 
                          ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                          : 'bg-[var(--tg-theme-hint-color)]/20 text-[var(--tg-theme-hint-color)]'
                      }
                    `}>
                      {lesson.completed ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : lesson.available ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>

                    {/* Информация */}
                    <div className="flex-1">
                      <p className={`
                        font-medium
                        ${lesson.available 
                          ? 'text-[var(--tg-theme-text-color)]' 
                          : 'text-[var(--tg-theme-hint-color)]'
                        }
                      `}>
                        {blockIndex + 1}.{lessonIndex + 1} {lesson.title}
                      </p>
                      <p className="text-sm text-[var(--tg-theme-hint-color)]">
                        {lesson.duration} мин
                      </p>
                    </div>

                    {/* Стрелка */}
                    {lesson.available && (
                      <svg className="w-5 h-5 text-[var(--tg-theme-hint-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

