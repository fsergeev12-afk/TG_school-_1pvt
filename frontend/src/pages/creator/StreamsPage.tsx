import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStreams, useCreateStream, useCourses } from '../../api/hooks';
import { PageContainer, PageContent, PageHeader } from '../../components/layout';
import { Button, Card, Input, Modal, Icons } from '../../components/ui';
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
  const [editingLessonTitle, setEditingLessonTitle] = useState('');
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
    setEditingLessonTitle(`${lesson.blockIndex}.${lesson.lessonIndex} ${lesson.title}`);
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

  return (
    <PageContainer>
      <PageHeader
        title="Modula"
        subtitle={streams ? `${streams.length} потоков` : 'Потоки'}
        action={
          !isCreating ? (
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Icons.Plus className="w-4 h-4" />
            </Button>
          ) : undefined
        }
      />

      <PageContent>
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
                  Выберите проект для потока:
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {courses?.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        // Очищаем расписание при выборе курса для нового потока
                        setLessonSchedules([]);
                        setScheduleEnabled(false);
                      }}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-colors flex items-center gap-3 ${
                        selectedCourseId === course.id
                          ? 'border-[var(--terracotta-main)] bg-[var(--terracotta-main)]/10'
                          : 'border-transparent bg-[var(--tg-theme-secondary-bg-color)]'
                      }`}
                    >
                      {/* Круглый чекбокс */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedCourseId === course.id
                          ? 'border-[var(--terracotta-main)] bg-[var(--terracotta-main)]'
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
                          разделов: {course.blocks?.length || 0} • материалов: {
                            course.blocks?.reduce((sum, b) => sum + (b.lessons?.length || 0), 0) || 0
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!courses || courses.length === 0) && (
                    <p className="text-sm text-[var(--tg-theme-hint-color)] text-center py-4">
                      Сначала создайте проект
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
                <div className="flex items-center gap-2 font-medium text-[var(--tg-theme-text-color)]">
                  <Icons.Calendar className="w-5 h-5 text-[var(--purple-main)]" />
                  Доступ к материалам
                </div>

                {/* Сначала информация о режиме по умолчанию */}
                <div className="p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl">
                  <div className="flex items-start gap-3">
                    <Icons.Book className="w-6 h-6 text-[var(--purple-main)] flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[var(--tg-theme-text-color)]">
                        По умолчанию: все материалы сразу
                      </p>
                      <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
                        Участники получат доступ ко всем материалам сразу после старта потока
                      </p>
                    </div>
                  </div>
                </div>

                {/* Потом галочка включения расписания */}
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors hover:border-[var(--tg-theme-button-color)]/30 ${scheduleEnabled ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/5' : 'border-[var(--tg-theme-hint-color)]/30'}`}>
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
                    <div className="flex items-center gap-2 font-medium text-[var(--tg-theme-text-color)]">
                      <Icons.Calendar className="w-4 h-4" />
                      Открывать материалы по расписанию
                    </div>
                    <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
                      Укажите дату открытия для каждого материала вручную
                    </p>
                  </div>
                </label>

                {scheduleEnabled && selectedCourse && (
                  <>
                    {/* Lesson list with dates */}
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                      {selectedCourse.blocks?.map((block, blockIdx) => (
                        <div key={block.id}>
                          <div className="flex items-center gap-2 py-1">
                            <Icons.Folder className="w-4 h-4 text-[var(--purple-main)]" />
                            <span className="text-sm font-medium text-[var(--tg-theme-text-color)]">
                              {blockIdx + 1}. {block.title}
                            </span>
                          </div>
                          
                          {block.lessons?.map((lesson, lessonIdx) => {
                            const schedule = getLessonSchedule(lesson.id);
                            return (
                              <div 
                                key={lesson.id}
                                className={`ml-4 flex items-center justify-between py-3 px-3 rounded-xl mb-2 ${
                                  schedule 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-[var(--tg-theme-secondary-bg-color)]'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--tg-theme-hint-color)] font-medium">
                                      {blockIdx + 1}.{lessonIdx + 1}
                                    </span>
                                    <span className="text-sm text-[var(--tg-theme-text-color)]">
                                      {lesson.title}
                                    </span>
                                  </div>
                                  {schedule && (
                                    <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                                      <Icons.Calendar className="w-3 h-3" />
                                      {formatDateTime(schedule.scheduledOpenAt)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  {schedule ? (
                                    <>
                                      <button
                                        onClick={() => openDatePicker({ ...lesson, blockIndex: blockIdx + 1, lessonIndex: lessonIdx + 1 })}
                                        className="p-2 text-[var(--tg-theme-hint-color)] hover:text-[var(--tg-theme-text-color)]"
                                      >
                                        <Icons.Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => removeLessonDate(lesson.id)}
                                        className="p-2 text-red-400 hover:text-red-500"
                                      >
                                        <Icons.Close className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => openDatePicker({ ...lesson, blockIndex: blockIdx + 1, lessonIndex: lessonIdx + 1 })}
                                      className="px-4 py-2 bg-[var(--tg-theme-button-color)] text-white rounded-xl text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1"
                                    >
                                      <Icons.Calendar className="w-4 h-4" />
                                      Выбрать дату
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
                      <p className={`text-sm font-medium flex items-center gap-2 ${allLessonsScheduled ? 'text-green-700' : 'text-orange-700'}`}>
                        {allLessonsScheduled 
                          ? <><Icons.Check className="w-4 h-4" /> Все {allLessons.length} материалов запланировано</>
                          : <><Icons.Warning className="w-4 h-4" /> Запланировано {lessonSchedules.length} из {allLessons.length} материалов</>
                        }
                      </p>
                      {!allLessonsScheduled && (
                        <p className="text-xs text-orange-600 mt-1">
                          Укажите дату для всех материалов или отключите расписание
                        </p>
                      )}
                    </div>
                  </>
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
                <div className="flex items-center gap-2 font-medium text-[var(--tg-theme-text-color)]">
                  <Icons.Bell className="w-5 h-5 text-[var(--purple-main)]" />
                  Уведомления участникам
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] cursor-pointer opacity-70">
                    <input
                      type="checkbox"
                      checked={sendWelcome}
                      disabled
                      className="mt-1 w-5 h-5 accent-[var(--tg-theme-button-color)]"
                    />
                    <div>
                      <div className="flex items-center gap-2 font-medium text-[var(--tg-theme-text-color)]">
                        <Icons.Check className="w-4 h-4 text-green-500" />
                        Приветственное сообщение
                      </div>
                      <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                        Отправляется при первой активации участника
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
                        Уведомлять при открытии материала
                      </div>
                      <p className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                        {scheduleEnabled 
                          ? 'Участник получит уведомление, когда откроется новый материал'
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
                <div className="flex items-center gap-2 font-medium text-[var(--tg-theme-text-color)]">
                  <Icons.Edit className="w-5 h-5 text-[var(--purple-main)]" />
                  Название потока
                </div>
                <Input
                  placeholder="Группа декабрь 2024"
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-[var(--tg-theme-hint-color)] flex items-center gap-1">
                  <Icons.Lightbulb className="w-3 h-3" />
                  Это название только для вас, ученики его не видят
                </p>

                {/* Summary */}
                <div className="p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl space-y-2">
                  <p className="text-sm font-medium text-[var(--tg-theme-text-color)] flex items-center gap-2">
                    <Icons.Document className="w-4 h-4" />
                    Итого:
                  </p>
                  <p className="text-xs text-[var(--tg-theme-hint-color)] flex items-center gap-1">
                    <Icons.Book className="w-3 h-3" />
                    Проект: {selectedCourse?.title}
                  </p>
                  <p className="text-xs text-[var(--tg-theme-hint-color)] flex items-center gap-1">
                    <Icons.Calendar className="w-3 h-3" />
                    Доступ: {scheduleEnabled ? `По расписанию (${lessonSchedules.length} материалов)` : 'Все материалы сразу'}
                  </p>
                  <p className="text-xs text-[var(--tg-theme-hint-color)] flex items-center gap-1">
                    <Icons.Bell className="w-3 h-3" />
                    Уведомления: {notifyOnLessonOpen ? 'Включены' : 'Только приветствие'}
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
                    <Icons.Rocket className="w-4 h-4" />
                    Создать поток
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
            <Icons.Chart className="w-12 h-12 mx-auto mb-3 text-[var(--purple-main)]" />
            <p className="text-[var(--tg-theme-hint-color)]">
              У вас пока нет потоков
            </p>
            <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
              Создайте поток, чтобы пригласить участников
            </p>
            <Button className="mt-4" onClick={() => setIsCreating(true)}>
              + Создать поток
            </Button>
          </div>
        )}

        {/* Список потоков */}
        <div className="space-y-5">
          {streams?.map((stream) => (
            <Card
              key={stream.id}
              variant="active"
              accentLine
              onClick={() => navigate(`/creator/streams/${stream.id}`)}
              className="active:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--purple-main)]/10 flex items-center justify-center flex-shrink-0">
                  <Icons.Users className="w-5 h-5 text-[var(--purple-main)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[17px] text-dark">
                    {stream.name}
                  </h3>
                  <p className="text-[13px] text-secondary mt-0.5">
                    Проект: {stream.course?.title || 'Не указан'}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[12px]">
                    <span className="text-secondary flex items-center gap-1">
                      <Icons.Mail className="w-3 h-3" />
                      {stream.studentsCount || 0}
                    </span>
                    <span className="text-secondary flex items-center gap-1">
                      <Icons.Check className="w-3 h-3" />
                      {stream.activatedCount || 0}
                    </span>
                    <span className="text-secondary flex items-center gap-1">
                      <Icons.CreditCard className="w-3 h-3" />
                      {stream.paidCount || 0}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted mt-2 flex items-center gap-1">
                    <Icons.Calendar className="w-3 h-3" />
                    {formatDate(stream.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageContent>

      {/* Date Picker Modal */}
      <Modal
        isOpen={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        title="Выбор даты открытия"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl">
            <p className="text-sm text-[var(--tg-theme-text-color)] font-medium">
              {editingLessonTitle}
            </p>
          </div>
          
          <Input
            label="Дата и время открытия материала"
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
    </PageContainer>
  );
}
