import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStreams, useCreateStream, useCourses } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Button, Card, Input, Modal } from '../../components/ui';
import { useUIStore } from '../../store';
import { Lesson } from '../../types';

interface LessonSchedule {
  lessonId: string;
  scheduledOpenAt: string;
}

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
  const [lessonSchedules, setLessonSchedules] = useState<LessonSchedule[]>([]);
  const [sendWelcome, setSendWelcome] = useState(true);
  const [notifyOnLessonOpen, setNotifyOnLessonOpen] = useState(false);
  const [streamName, setStreamName] = useState('');

  // Modal for date picker
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [tempDateTime, setTempDateTime] = useState('');

  const resetForm = () => {
    setIsCreating(false);
    setStep(1);
    setSelectedCourseId(null);
    setScheduleEnabled(false);
    setLessonSchedules([]);
    setSendWelcome(true);
    setNotifyOnLessonOpen(false);
    setStreamName('');
  };

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);

  // Get all lessons from selected course
  const allLessons = selectedCourse?.blocks?.flatMap((block, blockIdx) => 
    block.lessons?.map((lesson, lessonIdx) => ({
      ...lesson,
      blockTitle: block.title,
      blockIndex: blockIdx + 1,
      lessonIndex: lessonIdx + 1,
    })) || []
  ) || [];

  // Проверяем, все ли уроки запланированы
  const allLessonsScheduled = scheduleEnabled && lessonSchedules.length === allLessons.length;
  const canProceedFromStep2 = !scheduleEnabled || allLessonsScheduled;

  const handleCreate = async () => {
    if (!selectedCourseId || !streamName.trim()) return;

    try {
      const stream = await createStream.mutateAsync({
        name: streamName.trim(),
        courseId: selectedCourseId,
        scheduleEnabled,
        lessonSchedules: scheduleEnabled ? lessonSchedules : undefined,
      });
      resetForm();
      showToast('Поток создан!', 'success');
      navigate(`/creator/streams/${stream.id}`);
    } catch {
      showToast('Ошибка создания потока', 'error');
    }
  };

  const getLessonSchedule = (lessonId: string) => {
    return lessonSchedules.find(s => s.lessonId === lessonId);
  };

  const openDatePicker = (lesson: Lesson & { blockIndex: number; lessonIndex: number }) => {
    setEditingLessonId(lesson.id);
    const existing = getLessonSchedule(lesson.id);
    setTempDateTime(existing?.scheduledOpenAt || '');
    setDateModalOpen(true);
  };

  const saveLessonDate = () => {
    if (!editingLessonId || !tempDateTime) return;
    
    setLessonSchedules(prev => {
      const existing = prev.findIndex(s => s.lessonId === editingLessonId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { lessonId: editingLessonId, scheduledOpenAt: tempDateTime };
        return updated;
      }
      return [...prev, { lessonId: editingLessonId, scheduledOpenAt: tempDateTime }];
    });
    setDateModalOpen(false);
    setEditingLessonId(null);
    setTempDateTime('');
  };

  const removeLessonDate = (lessonId: string) => {
    setLessonSchedules(prev => prev.filter(s => s.lessonId !== lessonId));
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Auto-schedule functionality
  const [autoScheduleOpen, setAutoScheduleOpen] = useState(false);
  const [autoStartDate, setAutoStartDate] = useState('');
  const [autoIntervalDays, setAutoIntervalDays] = useState(1);

  const applyAutoSchedule = () => {
    if (!autoStartDate) return;
    
    const startDate = new Date(autoStartDate);
    const newSchedules: LessonSchedule[] = [];
    
    allLessons.forEach((lesson, index) => {
      const lessonDate = new Date(startDate);
      lessonDate.setDate(lessonDate.getDate() + (index * autoIntervalDays));
      
      newSchedules.push({
        lessonId: lesson.id,
        scheduledOpenAt: lessonDate.toISOString().slice(0, 16),
      });
    });
    
    setLessonSchedules(newSchedules);
    setAutoScheduleOpen(false);
    showToast(`Расписание создано: ${allLessons.length} уроков`, 'success');
  };

  return (
    <div className="pb-24">
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
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-colors flex items-center gap-3 ${
                        selectedCourseId === course.id
                          ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/5'
                          : 'border-transparent bg-[var(--tg-theme-secondary-bg-color)]'
                      }`}
                    >
                      {/* Круглый чекбокс */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedCourseId === course.id
                          ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]'
                          : 'border-[var(--tg-theme-hint-color)]/50'
                      }`}>
                        {selectedCourseId === course.id && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--tg-theme-text-color)]">
                          {course.title}
                        </div>
                        <div className="text-sm text-[var(--tg-theme-hint-color)]">
                          {course.blocks?.length || 0} блоков • {
                            course.blocks?.reduce((sum, b) => sum + (b.lessons?.length || 0), 0) || 0
                          } уроков
                        </div>
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
                  📅 Расписание уроков
                </p>
                
                <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => {
                      setScheduleEnabled(e.target.checked);
                      if (e.target.checked) setNotifyOnLessonOpen(true);
                      if (!e.target.checked) setLessonSchedules([]);
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
                  <>
                    {/* Auto-schedule button */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--tg-theme-hint-color)]">
                        Настройте дату открытия для каждого урока
                      </span>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setAutoScheduleOpen(true)}
                      >
                        ⚡ Авто
                      </Button>
                    </div>

                    {/* Lesson list with dates */}
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {selectedCourse.blocks?.map((block, blockIdx) => (
                        <div key={block.id}>
                          <div className="flex items-center gap-2 py-1">
                            <span className="text-sm">📂</span>
                            <span className="text-sm font-medium text-[var(--tg-theme-text-color)]">
                              {blockIdx + 1}. {block.title}
                            </span>
                          </div>
                          
                          {block.lessons?.map((lesson, lessonIdx) => {
                            const schedule = getLessonSchedule(lesson.id);
                            return (
                              <div 
                                key={lesson.id}
                                className={`ml-4 flex items-center justify-between py-2 px-3 rounded-lg mb-1 ${
                                  schedule 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-[var(--tg-theme-secondary-bg-color)]'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs text-[var(--tg-theme-hint-color)]">
                                    {blockIdx + 1}.{lessonIdx + 1}
                                  </span>
                                  <span className="text-sm text-[var(--tg-theme-text-color)] ml-2 truncate">
                                    {lesson.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {schedule ? (
                                    <>
                                      <span className="text-xs text-green-700 font-medium">
                                        {formatDateTime(schedule.scheduledOpenAt)}
                                      </span>
                                      <button
                                        onClick={() => openDatePicker({ ...lesson, blockIndex: blockIdx + 1, lessonIndex: lessonIdx + 1 })}
                                        className="p-1 text-[var(--tg-theme-hint-color)]"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => removeLessonDate(lesson.id)}
                                        className="p-1 text-red-500"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => openDatePicker({ ...lesson, blockIndex: blockIdx + 1, lessonIndex: lessonIdx + 1 })}
                                      className="text-xs text-[var(--tg-theme-button-color)] font-medium px-2 py-1 rounded bg-[var(--tg-theme-button-color)]/10"
                                    >
                                      📅 Выбрать дату
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Статус заполнения */}
                    <div className={`p-3 rounded-xl ${allLessonsScheduled ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                      <p className={`text-sm font-medium ${allLessonsScheduled ? 'text-green-700' : 'text-orange-700'}`}>
                        {allLessonsScheduled 
                          ? `✓ Все ${allLessons.length} уроков запланированы`
                          : `⚠️ Запланировано ${lessonSchedules.length} из ${allLessons.length} уроков`
                        }
                      </p>
                      {!allLessonsScheduled && (
                        <p className="text-xs text-orange-600 mt-1">
                          Укажите дату для всех уроков или отключите расписание
                        </p>
                      )}
                    </div>
                  </>
                )}

                {!scheduleEnabled && (
                  <div className="p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl">
                    <p className="text-sm text-[var(--tg-theme-text-color)]">
                      📖 Все уроки будут доступны сразу
                    </p>
                    <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                      Ученики получат доступ ко всем урокам после оплаты
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    ←
                  </Button>
                  <Button 
                    fullWidth 
                    onClick={() => setStep(3)}
                    disabled={!canProceedFromStep2}
                  >
                    Далее →
                  </Button>
                </div>
              </>
            )}

            {/* Шаг 3: Уведомления */}
            {step === 3 && (
              <>
                <p className="font-medium text-[var(--tg-theme-text-color)]">
                  🔔 Уведомления ученикам
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
                    ←
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
                  ✍️ Название потока
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

                {/* Summary */}
                <div className="p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl space-y-2">
                  <p className="text-sm font-medium text-[var(--tg-theme-text-color)]">
                    📋 Итого:
                  </p>
                  <p className="text-xs text-[var(--tg-theme-hint-color)]">
                    📚 Курс: {selectedCourse?.title}
                  </p>
                  <p className="text-xs text-[var(--tg-theme-hint-color)]">
                    📅 Расписание: {scheduleEnabled ? `${lessonSchedules.length} уроков` : 'Все сразу'}
                  </p>
                  <p className="text-xs text-[var(--tg-theme-hint-color)]">
                    🔔 Уведомления: {notifyOnLessonOpen ? 'Включены' : 'Только приветствие'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(3)}>
                    ←
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

      {/* Date Picker Modal */}
      <Modal
        isOpen={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        title="📅 Выбор даты открытия"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Дата и время *"
            type="datetime-local"
            value={tempDateTime}
            onChange={(e) => setTempDateTime(e.target.value)}
          />
          <Button
            fullWidth
            onClick={saveLessonDate}
            disabled={!tempDateTime}
          >
            Сохранить
          </Button>
        </div>
      </Modal>

      {/* Auto Schedule Modal */}
      <Modal
        isOpen={autoScheduleOpen}
        onClose={() => setAutoScheduleOpen(false)}
        title="⚡ Авто-расписание"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Создать расписание для всех {allLessons.length} уроков
          </p>

          <Input
            label="Дата начала *"
            type="datetime-local"
            value={autoStartDate}
            onChange={(e) => setAutoStartDate(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
              Интервал между уроками
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 7].map((days) => (
                <button
                  key={days}
                  onClick={() => setAutoIntervalDays(days)}
                  className={`p-2 rounded-lg border-2 text-xs transition-colors ${
                    autoIntervalDays === days
                      ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10'
                      : 'border-[var(--tg-theme-hint-color)]/30'
                  }`}
                >
                  {days === 1 ? '1 день' : days === 7 ? 'Неделя' : `${days} дня`}
                </button>
              ))}
            </div>
          </div>

          <Button
            fullWidth
            onClick={applyAutoSchedule}
            disabled={!autoStartDate}
          >
            Применить
          </Button>
        </div>
      </Modal>
    </div>
  );
}
