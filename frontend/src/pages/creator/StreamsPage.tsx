import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStreams, useCreateStream, useCourses } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Button, Card, Input } from '../../components/ui';
import { useUIStore } from '../../store';

export default function StreamsPage() {
  const navigate = useNavigate();
  const { data: streams, isLoading } = useStreams();
  const { data: courses } = useCourses();
  const createStream = useCreateStream();
  const { showToast } = useUIStore();

  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [sendWelcome, setSendWelcome] = useState(true);
  const [notifyOnLessonOpen, setNotifyOnLessonOpen] = useState(false);
  const [streamName, setStreamName] = useState('');

  const resetForm = () => {
    setIsCreating(false);
    setStep(1);
    setSelectedCourseId(null);
    setScheduleEnabled(false);
    setSendWelcome(true);
    setNotifyOnLessonOpen(false);
    setStreamName('');
  };

  const handleCreate = async () => {
    if (!selectedCourseId || !streamName.trim()) return;

    try {
      const stream = await createStream.mutateAsync({
        name: streamName.trim(),
        courseId: selectedCourseId,
        scheduleEnabled,
      });
      resetForm();
      showToast('Поток создан!', 'success');
      navigate(`/creator/streams/${stream.id}`);
    } catch {
      showToast('Ошибка создания потока', 'error');
    }
  };

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div>
      <PageHeader
        title="Потоки"
        subtitle={streams ? `${streams.length} потоков` : undefined}
        action={
          <Button size="sm" onClick={() => setIsCreating(true)}>
            + Создать
          </Button>
        }
      />

      <div className="p-4 space-y-3">
        {/* Мастер создания потока - 4 шага */}
        {isCreating && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
                Создание потока
              </h3>
              <span className="text-sm text-[var(--tg-theme-hint-color)]">
                Шаг {step} из 4
              </span>
            </div>

            {/* Прогресс-бар */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-[var(--tg-theme-button-color)]' : 'bg-[var(--tg-theme-hint-color)]/20'
                  }`}
                />
              ))}
            </div>

            {/* Шаг 1: Выбор курса */}
            {step === 1 && (
              <>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">
                  Выберите курс для потока:
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {courses?.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedCourseId === course.id
                          ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/5'
                          : 'border-transparent bg-[var(--tg-theme-secondary-bg-color)]'
                      }`}
                    >
                      <div className="font-medium text-[var(--tg-theme-text-color)]">
                        {course.title}
                      </div>
                      <div className="text-sm text-[var(--tg-theme-hint-color)]">
                        {course.blocks?.length || 0} блоков • {
                          course.blocks?.reduce((sum, b) => sum + (b.lessons?.length || 0), 0) || 0
                        } уроков
                      </div>
                    </div>
                  ))}
                  {(!courses || courses.length === 0) && (
                    <p className="text-sm text-[var(--tg-theme-hint-color)] text-center py-4">
                      Сначала создайте курс
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    fullWidth
                    onClick={() => setStep(2)}
                    disabled={!selectedCourseId}
                  >
                    Далее →
                  </Button>
                  <Button variant="secondary" onClick={resetForm}>
                    Отмена
                  </Button>
                </div>
              </>
            )}

            {/* Шаг 2: Расписание */}
            {step === 2 && (
              <>
                <p className="font-medium text-[var(--tg-theme-text-color)]">
                  Расписание уроков
                </p>
                
                <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => {
                      setScheduleEnabled(e.target.checked);
                      if (e.target.checked) setNotifyOnLessonOpen(true);
                    }}
                    className="mt-1 w-5 h-5 accent-[var(--tg-theme-button-color)]"
                  />
                  <div>
                    <div className="font-medium text-[var(--tg-theme-text-color)]">
                      Открывать уроки по расписанию
                    </div>
                    <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                      Уроки будут открываться автоматически в указанное время
                    </p>
                  </div>
                </label>

                {scheduleEnabled && selectedCourse && (
                  <div className="text-xs text-[var(--tg-theme-hint-color)] p-3 bg-blue-50 rounded-xl">
                    ℹ️ После создания потока вы сможете настроить даты открытия для каждого урока в настройках потока.
                    <br />
                    Курс: {selectedCourse.title}
                  </div>
                )}

                {!scheduleEnabled && (
                  <p className="text-xs text-[var(--tg-theme-hint-color)]">
                    Все уроки будут доступны сразу после оплаты
                  </p>
                )}

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    ← Назад
                  </Button>
                  <Button fullWidth onClick={() => setStep(3)}>
                    Далее →
                  </Button>
                </div>
              </>
            )}

            {/* Шаг 3: Уведомления */}
            {step === 3 && (
              <>
                <p className="font-medium text-[var(--tg-theme-text-color)]">
                  Уведомления ученикам
                </p>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] cursor-pointer opacity-70">
                    <input
                      type="checkbox"
                      checked={sendWelcome}
                      disabled
                      className="mt-1 w-5 h-5 accent-[var(--tg-theme-button-color)]"
                    />
                    <div>
                      <div className="font-medium text-[var(--tg-theme-text-color)]">
                        ✅ Приветственное сообщение
                      </div>
                      <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                        Отправляется при первой активации ученика
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] cursor-pointer ${!scheduleEnabled ? 'opacity-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={notifyOnLessonOpen}
                      onChange={(e) => setNotifyOnLessonOpen(e.target.checked)}
                      disabled={!scheduleEnabled}
                      className="mt-1 w-5 h-5 accent-[var(--tg-theme-button-color)]"
                    />
                    <div>
                      <div className="font-medium text-[var(--tg-theme-text-color)]">
                        Уведомлять при открытии урока
                      </div>
                      <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                        {scheduleEnabled 
                          ? 'Ученик получит уведомление, когда откроется новый урок'
                          : 'Доступно только при включённом расписании'}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(2)}>
                    ← Назад
                  </Button>
                  <Button fullWidth onClick={() => setStep(4)}>
                    Далее →
                  </Button>
                </div>
              </>
            )}

            {/* Шаг 4: Название */}
            {step === 4 && (
              <>
                <p className="font-medium text-[var(--tg-theme-text-color)]">
                  Название потока
                </p>
                <Input
                  placeholder="Группа декабрь 2024"
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-[var(--tg-theme-hint-color)]">
                  💡 Это название только для вас, ученики его не видят
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(3)}>
                    ← Назад
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleCreate}
                    loading={createStream.isPending}
                    disabled={!streamName.trim()}
                  >
                    🚀 Создать поток
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {/* Загрузка */}
        {isLoading && (
          <div className="text-center py-8 text-[var(--tg-theme-hint-color)]">
            Загрузка...
          </div>
        )}

        {/* Пустой список */}
        {!isLoading && streams?.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-[var(--tg-theme-hint-color)]">
              У вас пока нет потоков
            </p>
            <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
              Создайте поток, чтобы пригласить учеников
            </p>
            <Button className="mt-4" onClick={() => setIsCreating(true)}>
              + Создать поток
            </Button>
          </div>
        )}

        {/* Список потоков */}
        {streams?.map((stream) => (
          <Card
            key={stream.id}
            onClick={() => navigate(`/creator/streams/${stream.id}`)}
            className="active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--tg-theme-button-color)]/10 flex items-center justify-center text-xl">
                📊
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
                  {stream.name}
                </h3>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">
                  Курс: {stream.course?.title || 'Не указан'}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                  <span className="text-[var(--tg-theme-hint-color)]">
                    👥 Приглашено: {stream.studentsCount || 0}
                  </span>
                  <span className="text-[var(--tg-theme-hint-color)]">
                    ✅ Активировано: {stream.activatedCount || 0}
                  </span>
                  <span className="text-[var(--tg-theme-hint-color)]">
                    💳 Оплачено: {stream.paidCount || 0}
                  </span>
                </div>
                <p className="text-xs text-[var(--tg-theme-hint-color)] mt-2">
                  📅 Создан: {formatDate(stream.createdAt)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

