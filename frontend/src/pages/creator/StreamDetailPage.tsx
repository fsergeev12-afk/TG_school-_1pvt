import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useStream, 
  useStreamStudents, 
  useSendBroadcast, 
  useDeleteStream,
  useStreamSchedule,
  useCourse
} from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Button, Card, Input, Modal } from '../../components/ui';
import { useUIStore } from '../../store';

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
  const { showToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Add students modal
  const [addStudentsModalOpen, setAddStudentsModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

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
    { id: 'students' as TabType, label: 'Ученики' },
    { id: 'schedule' as TabType, label: '📅' },
    { id: 'broadcast' as TabType, label: 'Рассылка' },
    { id: 'payments' as TabType, label: 'Оплаты' },
    { id: 'settings' as TabType, label: '⚙️' },
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
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <PageHeader
        title={stream.name}
        subtitle={stream.course?.title}
        showBack
      />

      {/* Табы */}
      <div className="flex border-b border-[var(--tg-theme-hint-color)]/20 px-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-color)]'
                : 'border-transparent text-[var(--tg-theme-hint-color)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Вкладка "Ученики" */}
        {activeTab === 'students' && (
          <div className="space-y-3">
            <Button 
              variant="secondary" 
              fullWidth
              onClick={() => {
                // Telegram deep link формат
                // inviteToken генерируется на бэкенде вместе с потоком
                const botUsername = 'Bllocklyyy_bot';
                const token = stream?.inviteToken || id;
                const link = `https://t.me/${botUsername}?start=${token}`;
                setInviteLink(link);
                setIsCopied(false);
                setAddStudentsModalOpen(true);
              }}
            >
              📤 Добавить учеников
            </Button>

            {students?.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-[var(--tg-theme-hint-color)]">
                  Пока нет учеников
                </p>
                <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
                  Пригласите учеников, чтобы они появились здесь
                </p>
              </div>
            )}

            {students?.map((student) => (
              <Card key={student.id}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-button-color)]/20 flex items-center justify-center text-sm font-medium text-[var(--tg-theme-button-color)]">
                    {student.firstName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--tg-theme-text-color)]">
                      {student.firstName} {student.lastName}
                    </div>
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
                  <button
                    className="p-2 text-[var(--tg-theme-hint-color)]"
                    onClick={() => navigate(`/creator/chats/${student.id}`)}
                  >
                    💬
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Вкладка "Расписание" */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
              📅 Расписание уроков
            </h3>

            {!stream.scheduleEnabled ? (
              <Card className="text-center py-8">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-[var(--tg-theme-hint-color)]">
                  Расписание отключено
                </p>
                <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
                  Все уроки доступны сразу после оплаты
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {allLessons.map((lesson) => {
                  const schedule = schedules?.find(s => s.lessonId === lesson.id);
                  return (
                    <Card key={lesson.id} padding="sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-[var(--tg-theme-hint-color)]">
                            {lesson.blockIndex}.{lesson.lessonIndex}
                          </span>
                          <div className="font-medium text-sm text-[var(--tg-theme-text-color)] truncate">
                            {lesson.title}
                          </div>
                        </div>
                        <div className="text-right">
                          {schedule ? (
                            <div className={`text-xs ${schedule.isOpened ? 'text-green-600' : 'text-[var(--tg-theme-hint-color)]'}`}>
                              {schedule.isOpened ? '✅ Открыт' : formatDate(schedule.scheduledOpenAt)}
                            </div>
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
                    В курсе пока нет уроков
                  </p>
                )}
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
              <span>👥 Получатели: {activatedCount} активированных учеников</span>
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
                  {(paidCount * (stream.price || 3000)).toLocaleString()} ₽
                </div>
                <div className="text-xs text-[var(--tg-theme-hint-color)]">Выручка</div>
              </Card>
            </div>

            <h4 className="font-medium text-[var(--tg-theme-text-color)] mt-6">
              Последние платежи
            </h4>
            {paidCount === 0 ? (
              <p className="text-sm text-[var(--tg-theme-hint-color)] text-center py-4">
                Пока нет платежей
              </p>
            ) : (
              <div className="space-y-2">
                {students?.filter(s => s.paymentStatus === 'paid').slice(0, 5).map((student) => (
                  <Card key={student.id} padding="sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--tg-theme-text-color)]">
                        {student.firstName} {student.lastName}
                      </span>
                      <span className="text-sm text-[var(--tg-theme-hint-color)]">
                        {(stream.price || 3000).toLocaleString()} ₽
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
                Курс: {stream.course?.title}
              </p>
            </Card>

            <Card>
              <h4 className="font-medium text-[var(--tg-theme-text-color)] mb-3">
                Монетизация
              </h4>
              <div className="flex items-center gap-2">
                <Input
                  label="Цена курса"
                  type="number"
                  value={stream.price || 3000}
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
                ⚠️ Это действие нельзя отменить. Все ученики потеряют доступ к курсу.
              </p>
              {isDeleting ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">
                    Вы уверены? В потоке {students?.length || 0} учеников.
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
      </div>

      {/* Add Students Modal */}
      <Modal
        isOpen={addStudentsModalOpen}
        onClose={() => setAddStudentsModalOpen(false)}
        title="📤 Добавить учеников"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Поделитесь ссылкой-приглашением с учениками. После перехода по ссылке они смогут оплатить курс и получить доступ.
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
                const text = encodeURIComponent(`Приглашаю на курс "${stream?.course?.title}"\n${inviteLink}`);
                window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`, '_blank');
              }}
            >
              📱 Telegram
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
