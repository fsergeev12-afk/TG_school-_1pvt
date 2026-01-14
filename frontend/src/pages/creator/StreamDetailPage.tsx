import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useStream, 
  useStreamStudents, 
  useSendBroadcast, 
  useDeleteStream,
  useStreamSchedule,
  useCourse,
  useRemoveStudent,
  useCreateOrGetConversation,
  useOpenAllLessons,
  useUpdateSchedule
} from '../../api/hooks';
import { PageContainer, PageContent, PageHeader } from '../../components/layout';
import { Button, Card, Input, Modal, Icons } from '../../components/ui';
import { useUIStore } from '../../store';
import { generateInviteLink } from '../../config';

type TabType = 'students' | 'schedule' | 'broadcast' | 'payments' | 'settings';

export default function StreamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: stream, isLoading } = useStream(id!);
  const { data: students } = useStreamStudents(id!);
  const { data: schedules } = useStreamSchedule(id!);
  const { data: course } = useCourse(stream?.courseId || '');
  const sendBroadcast = useSendBroadcast();
  const deleteStream = useDeleteStream();
  const removeStudent = useRemoveStudent();
  const createOrGetConversation = useCreateOrGetConversation();
  const openAllLessons = useOpenAllLessons();
  const updateSchedule = useUpdateSchedule();
  const { showToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Add students modal
  const [addStudentsModalOpen, setAddStudentsModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Delete student confirmation
  const [deleteStudentConfirm, setDeleteStudentConfirm] = useState<{ id: string; name: string } | null>(null);
  const [openAllConfirm, setOpenAllConfirm] = useState(false);
  
  // Edit schedule modal
  const [editScheduleModalOpen, setEditScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<{ scheduleId: string; lessonId: string; lessonTitle: string; currentDate: string } | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState('');

  const handleRemoveStudent = async () => {
    if (!deleteStudentConfirm || !id) return;
    try {
      await removeStudent.mutateAsync({ streamId: id, studentId: deleteStudentConfirm.id });
      setDeleteStudentConfirm(null);
      showToast('Участник удалён из потока', 'success');
    } catch {
      showToast('Ошибка удаления участника', 'error');
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || !id) return;
    try {
      await sendBroadcast.mutateAsync({ streamId: id, message: broadcastMessage.trim() });
      setBroadcastMessage('');
      showToast('Рассылка отправлена!', 'success');
    } catch {
      showToast('Ошибка отправки', 'error');
    }
  };

  const handleDeleteStream = async () => {
    if (!id) return;
    try {
      await deleteStream.mutateAsync(id);
      showToast('Поток удалён', 'success');
      navigate('/creator/streams');
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  const handleOpenAllLessons = async () => {
    if (!id) return;
    try {
      const result = await openAllLessons.mutateAsync(id);
      showToast(`Открыто ${result.openedCount} материалов!`, 'success');
      setOpenAllConfirm(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка открытия', 'error');
    }
  };

  const handleEditSchedule = (scheduleId: string, lessonId: string, lessonTitle: string, currentDate: string | null) => {
    setEditingSchedule({ scheduleId, lessonId, lessonTitle, currentDate: currentDate || '' });
    // Форматируем дату для input type="datetime-local" (YYYY-MM-DDTHH:mm)
    // Конвертируем UTC -> MSK для отображения
    if (currentDate) {
      const utcDate = new Date(currentDate);
      const mskDate = new Date(utcDate.getTime() + 3 * 60 * 60 * 1000); // UTC -> MSK (+3 часа)
      const formatted = new Date(mskDate.getTime() - mskDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setNewScheduleDate(formatted);
    } else {
      setNewScheduleDate('');
    }
    setEditScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!editingSchedule || !id || !newScheduleDate) return;
    try {
      // Конвертируем дату из MSK в UTC
      // newScheduleDate - это строка "2026-01-09T16:03" в MSK
      // Нужно интерпретировать её как MSK и конвертировать в UTC
      const [datePart, timePart] = newScheduleDate.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Создаём дату как UTC, но вычитаем 3 часа (т.к. пользователь ввёл MSK)
      const mskDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
      const utcDate = new Date(mskDate.getTime() - 3 * 60 * 60 * 1000); // MSK -> UTC (-3 часа)
      
      await updateSchedule.mutateAsync({
        streamId: id,
        scheduleId: editingSchedule.scheduleId,
        scheduledOpenAt: utcDate.toISOString(),
      });
      showToast('Расписание обновлено', 'success');
      setEditScheduleModalOpen(false);
      setEditingSchedule(null);
      setNewScheduleDate('');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Ошибка обновления', 'error');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      showToast('Ссылка скопирована!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast('Ошибка копирования', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--tg-theme-hint-color)]">Поток не найден</div>
      </div>
    );
  }

  const tabs = [
    { id: 'students' as TabType, label: 'Участники', icon: 'users' },
    { id: 'schedule' as TabType, label: 'Расписание', icon: 'calendar' },
    { id: 'broadcast' as TabType, label: 'Рассылка', icon: 'broadcast' },
    { id: 'payments' as TabType, label: 'Оплаты', icon: 'money' },
    { id: 'settings' as TabType, label: 'Настройки', icon: 'settings' },
  ];

  const activatedCount = students?.filter(s => s.invitationStatus === 'activated').length || 0;
  const paidCount = students?.filter(s => s.paymentStatus === 'paid').length || 0;

  // Get all lessons from course
  const allLessons = course?.blocks?.flatMap((block, blockIdx) => 
    block.lessons?.map((lesson, lessonIdx) => ({
      ...lesson,
      blockTitle: block.title,
      blockIndex: blockIdx + 1,
      lessonIndex: lessonIdx + 1,
    })) || []
  ) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title={stream.name}
        subtitle={stream.course?.title}
        showBack
      />

      {/* Табы */}
      <div className="relative">
        <div className="flex border-b border-[var(--purple-main)]/10 px-2 overflow-x-auto bg-white/40 backdrop-blur-soft hide-scrollbar">
          {tabs.map((tab) => {
            const IconComponent = tab.icon === 'users' ? Icons.Users 
              : tab.icon === 'calendar' ? Icons.Calendar
              : tab.icon === 'broadcast' ? Icons.Broadcast
              : tab.icon === 'money' ? Icons.Money
              : Icons.Settings;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all min-h-[52px] ${
                  activeTab === tab.id
                    ? 'border-[var(--terracotta-main)] text-dark'
                    : 'border-transparent text-secondary'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        {/* Индикатор горизонтальной прокрутки */}
        <div className="absolute bottom-0 right-4 h-1 w-12 bg-[var(--purple-main)]/20 rounded-full pointer-events-none" />
      </div>

      <PageContent>
        {/* Вкладка "Ученики" */}
        {activeTab === 'students' && (
          <div className="space-y-3">
            <Button 
              variant="secondary" 
              fullWidth
              onClick={() => {
                // Используем inviteToken потока для генерации Telegram deep link
                const token = stream.inviteToken;
                const link = generateInviteLink(token);
                setInviteLink(link);
                setIsCopied(false);
                setAddStudentsModalOpen(true);
              }}
            >
              📤 Добавить участников
            </Button>

            {/* Статистика */}
            {students && students.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <Card className="text-center py-3">
                  <div className="text-xl font-bold text-[var(--tg-theme-text-color)]">
                    {students?.length || 0}
                  </div>
                  <div className="text-xs text-[var(--tg-theme-hint-color)]">Всего</div>
                </Card>
                <Card className="text-center py-3">
                  <div className="text-xl font-bold text-green-600">
                    {activatedCount}
                  </div>
                  <div className="text-xs text-[var(--tg-theme-hint-color)]">Активировано</div>
                </Card>
                <Card className="text-center py-3">
                  <div className="text-xl font-bold text-blue-600">
                    {paidCount}
                  </div>
                  <div className="text-xs text-[var(--tg-theme-hint-color)]">Оплачено</div>
                </Card>
              </div>
            )}

            {students?.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-[var(--tg-theme-hint-color)]">
                  Пока нет участников
                </p>
                <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
                  Пригласите участников, чтобы они появились здесь
                </p>
              </div>
            )}

            {students?.map((student) => (
              <Card key={student.id}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-button-color)]/20 flex items-center justify-center text-sm font-medium text-[var(--tg-theme-button-color)]">
                    {student.firstName?.[0] || student.telegramFirstName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--tg-theme-text-color)]">
                      {student.firstName || student.telegramFirstName || 'Без имени'} {student.lastName || student.telegramLastName || ''}
                    </div>
                    {student.telegramUsername ? (
                      <div className="text-xs text-[var(--tg-theme-link-color)]">
                        @{student.telegramUsername}
                      </div>
                    ) : null}
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className={`px-2 py-0.5 rounded ${
                        student.invitationStatus === 'activated'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {student.invitationStatus === 'activated' ? '✅ Активен' : '⏳ Приглашён'}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        student.paymentStatus === 'paid'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {student.paymentStatus === 'paid' ? '💳 Оплачено' : '🏃 Не оплачено'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--tg-theme-link-color)] hover:bg-[var(--tg-theme-secondary-bg-color)]"
                      onClick={async () => {
                        try {
                          const conversationId = await createOrGetConversation.mutateAsync(student.telegramId);
                          navigate(`/creator/chats/${conversationId}`);
                        } catch (error) {
                          showToast('Ошибка создания диалога', 'error');
                        }
                      }}
                      title="Написать сообщение"
                    >
                      💬
                    </button>
                    <button
                      className="w-10 h-10 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50"
                      onClick={() => setDeleteStudentConfirm({ id: student.id, name: student.firstName || student.telegramFirstName || 'Участник' })}
                      title="Удалить из потока"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Вкладка "Расписание" */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
              📅 Расписание материалов
            </h3>

            {!stream.scheduleEnabled ? (
              <Card className="text-center py-8">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-[var(--tg-theme-hint-color)]">
                  Расписание отключено
                </p>
                <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
                  Все материалы доступны сразу после оплаты
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Кнопка "Открыть все материалы" - показывается если есть закрытые уроки */}
                {schedules && schedules.some(s => !s.isOpened) && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setOpenAllConfirm(true)}
                  >
                    🎉 Открыть все материалы
                  </Button>
                )}

                <div className="space-y-2">
                {allLessons.map((lesson) => {
                  const schedule = schedules?.find(s => s.lessonId === lesson.id);
                  return (
                    <Card 
                      key={lesson.id} 
                      padding="sm"
                      className="cursor-pointer hover:bg-[var(--tg-theme-secondary-bg-color)] active:opacity-70 transition-all"
                      onClick={() => {
                        if (schedule) {
                          handleEditSchedule(schedule.id, lesson.id, lesson.title, schedule.scheduledOpenAt);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-[var(--tg-theme-hint-color)]">
                            {lesson.blockIndex}.{lesson.lessonIndex}
                          </span>
                          <div className="font-medium text-sm text-[var(--tg-theme-text-color)]">
                            {lesson.title}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          {schedule ? (
                            <>
                              <div className={`text-xs ${schedule.isOpened ? 'text-green-600' : 'text-[var(--tg-theme-hint-color)]'}`}>
                                {schedule.isOpened ? '✅ Открыт' : formatDate(schedule.scheduledOpenAt)}
                              </div>
                              <svg className="w-4 h-4 text-[var(--tg-theme-hint-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--tg-theme-hint-color)]">
                              Не назначено
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {allLessons.length === 0 && (
                  <p className="text-sm text-[var(--tg-theme-hint-color)] text-center py-4">
                    В проекте пока нет материалов
                  </p>
                )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Вкладка "Рассылка" */}
        {activeTab === 'broadcast' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
              📢 Отправить сообщение
            </h3>
            <textarea
              className="w-full p-3 rounded-xl border border-[var(--tg-theme-hint-color)]/30 bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] min-h-[120px] resize-none"
              placeholder="Напишите сообщение для учеников..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-between text-xs text-[var(--tg-theme-hint-color)]">
              <span>👥 Получатели: {activatedCount} активированных участников</span>
              <span>{broadcastMessage.length} / 1000</span>
            </div>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">
              ℹ️ Ссылка на платформу добавится автоматически
            </p>
            <Button
              fullWidth
              onClick={handleSendBroadcast}
              loading={sendBroadcast.isPending}
              disabled={!broadcastMessage.trim()}
            >
              Отправить всем
            </Button>
          </div>
        )}

        {/* Вкладка "Оплаты" */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
              💳 Статистика оплат
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center">
                <div className="text-2xl font-bold text-[var(--tg-theme-text-color)]">
                  {students?.length || 0}
                </div>
                <div className="text-xs text-[var(--tg-theme-hint-color)]">Переходы</div>
              </Card>
              <Card className="text-center">
                <div className="text-2xl font-bold text-[var(--tg-theme-text-color)]">
                  {paidCount}
                </div>
                <div className="text-xs text-[var(--tg-theme-hint-color)]">Оплачено</div>
              </Card>
              <Card className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {students?.length ? Math.round(paidCount / students.length * 100) : 0}%
                </div>
                <div className="text-xs text-[var(--tg-theme-hint-color)]">Конверсия</div>
              </Card>
              <Card className="text-center">
                <div className="text-2xl font-bold text-[var(--tg-theme-button-color)]">
                  0 ₽
                </div>
                <div className="text-xs text-[var(--tg-theme-hint-color)]">Выручка</div>
                <div className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
                  (платежи не подключены)
                </div>
              </Card>
            </div>

            <h4 className="font-medium text-[var(--tg-theme-text-color)] mt-6">
              Последние платежи
            </h4>
            {paidCount === 0 ? (
              <p className="text-sm text-[var(--tg-theme-hint-color)] text-center py-4">
                Пока нет оплат
              </p>
            ) : (
              <div className="space-y-2">
                {students?.filter(s => s.paymentStatus === 'paid').slice(0, 5).map((student) => (
                  <Card key={student.id} padding="sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--tg-theme-text-color)]">
                        {student.firstName} {student.lastName}
                      </span>
                      <span className="text-sm text-green-600">
                        🎟️ Промокод
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Вкладка "Настройки" */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <Card>
              <h4 className="font-medium text-[var(--tg-theme-text-color)] mb-3">
                Основные
              </h4>
              <Input
                label="Название потока"
                value={stream.name}
                disabled
              />
              <p className="text-xs text-[var(--tg-theme-hint-color)] mt-2">
                Проект: {stream.course?.title}
              </p>
            </Card>

            <Card>
              <h4 className="font-medium text-[var(--tg-theme-text-color)] mb-3">
                Монетизация
              </h4>
              <div className="flex items-center gap-2">
                <Input
                  label="Цена проекта"
                  type="number"
                  value={stream.price || 0}
                  disabled
                />
                <span className="text-[var(--tg-theme-text-color)] mt-6">₽</span>
              </div>
            </Card>

            <Card>
              <h4 className="font-medium text-[var(--tg-theme-text-color)] mb-3">
                🎟️ Промокоды
              </h4>
              <Button 
                variant="secondary" 
                fullWidth
                onClick={() => navigate(`/creator/streams/${id}/promo-codes`)}
              >
                Управление промокодами →
              </Button>
            </Card>

            <Card className="border-2 border-red-200">
              <h4 className="font-medium text-red-600 mb-2">
                🗑️ Опасная зона
              </h4>
              <p className="text-xs text-[var(--tg-theme-hint-color)] mb-3">
                ⚠️ Это действие нельзя отменить. Все участники потеряют доступ к проекту.
              </p>
              {isDeleting ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">
                    Вы уверены? В потоке {students?.length || 0} участников.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setIsDeleting(false)}
                    >
                      Отмена
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600"
                      onClick={handleDeleteStream}
                      loading={deleteStream.isPending}
                    >
                      Да, удалить
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="bg-red-500 hover:bg-red-600"
                  fullWidth
                  onClick={() => setIsDeleting(true)}
                >
                  Удалить поток
                </Button>
              )}
            </Card>
          </div>
        )}
      </PageContent>

      {/* Add Students Modal */}
      <Modal
        isOpen={addStudentsModalOpen}
        onClose={() => setAddStudentsModalOpen(false)}
        title="📤 Добавить участников"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Поделитесь ссылкой-приглашением с участниками. После перехода по ссылке они смогут оплатить и получить доступ.
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
              Ссылка-приглашение
            </label>
            <div className="p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl break-all text-sm text-[var(--tg-theme-text-color)]">
              {inviteLink}
            </div>
          </div>

          {/* Кнопка копирования - динамичная */}
          <button
            onClick={handleCopyLink}
            className={`w-full py-4 rounded-xl font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 ${
              isCopied 
                ? 'bg-green-500 scale-[1.02]' 
                : 'bg-[var(--tg-theme-button-color)] hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            {isCopied ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Скопировано!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Скопировать ссылку
              </>
            )}
          </button>

          <div className="border-t border-[var(--tg-theme-hint-color)]/20 pt-4">
            <h4 className="font-medium text-sm text-[var(--tg-theme-text-color)] mb-3">
              Или поделиться через:
            </h4>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                const text = encodeURIComponent(`Приглашаю в проект "${stream?.name}"\n${inviteLink}`);
                window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`, '_blank');
              }}
            >
              📱 Telegram
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Student Confirmation */}
      <Modal
        isOpen={!!deleteStudentConfirm}
        onClose={() => setDeleteStudentConfirm(null)}
        title={`Удалить ${deleteStudentConfirm?.name}?`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Участник потеряет доступ к проекту и перестанет получать уведомления.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setDeleteStudentConfirm(null)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleRemoveStudent}
              loading={removeStudent.isPending}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Open All Lessons Confirmation */}
      <Modal
        isOpen={openAllConfirm}
        onClose={() => setOpenAllConfirm(false)}
        title="Открыть все материалы?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--tg-theme-text-color)]">
            Все запланированные материалы станут доступны студентам сразу.
          </p>
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            📬 Студенты получат одно уведомление о том, что все материалы открыты.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setOpenAllConfirm(false)}
            >
              Отмена
            </Button>
            <Button
              fullWidth
              onClick={handleOpenAllLessons}
              loading={openAllLessons.isPending}
            >
              Открыть все
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Schedule Modal */}
      <Modal
        isOpen={editScheduleModalOpen}
        onClose={() => {
          setEditScheduleModalOpen(false);
          setEditingSchedule(null);
          setNewScheduleDate('');
        }}
        title="Редактировать расписание"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-[var(--tg-theme-text-color)] mb-2">
              {editingSchedule?.lessonTitle}
            </p>
            <label className="block text-xs text-[var(--tg-theme-hint-color)] mb-2">
              Дата и время открытия:
            </label>
            <input
              type="datetime-local"
              value={newScheduleDate}
              onChange={(e) => setNewScheduleDate(e.target.value)}
              className="w-full p-3 rounded-xl border border-[var(--tg-theme-hint-color)]/30 bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-base"
            />
          </div>
          <p className="text-xs text-[var(--tg-theme-hint-color)]">
            ℹ️ Материал откроется автоматически в указанное время. Студенты получат уведомление.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setEditScheduleModalOpen(false);
                setEditingSchedule(null);
                setNewScheduleDate('');
              }}
            >
              Отмена
            </Button>
            <Button
              fullWidth
              onClick={handleSaveSchedule}
              loading={updateSchedule.isPending}
              disabled={!newScheduleDate}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
