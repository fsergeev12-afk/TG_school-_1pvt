import { useState } from 'react';
import { useStreams, useStreamStudents, useStudentStats } from '../../api/hooks';
import { PageHeader } from '../../components/layout';
import { Card, Badge, Button } from '../../components/ui';

export default function StudentsPage() {
  const { data: streams } = useStreams();
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  
  const { data: students } = useStreamStudents(selectedStreamId || '');
  const { data: stats } = useStudentStats(selectedStreamId || '');

  return (
    <div>
      <PageHeader title="Ученики" />

      <div className="p-4 space-y-4">
        {/* Выбор потока */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {streams?.map((stream) => (
            <button
              key={stream.id}
              onClick={() => setSelectedStreamId(stream.id)}
              className={`
                px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium
                transition-colors
                ${selectedStreamId === stream.id
                  ? 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]'
                  : 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]'
                }
              `}
            >
              {stream.name}
            </button>
          ))}
        </div>

        {!selectedStreamId && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-[var(--tg-theme-hint-color)]">
              Выберите поток для просмотра учеников
            </p>
          </div>
        )}

        {selectedStreamId && stats && (
          <>
            {/* Статистика */}
            <div className="grid grid-cols-4 gap-2">
              <Card padding="sm" className="text-center">
                <div className="text-xl font-bold text-[var(--tg-theme-text-color)]">
                  {stats.total}
                </div>
                <div className="text-xs text-[var(--tg-theme-hint-color)]">Всего</div>
              </Card>
              <Card padding="sm" className="text-center">
                <div className="text-xl font-bold text-blue-500">
                  {stats.activated}
                </div>
                <div className="text-xs text-[var(--tg-theme-hint-color)]">Актив.</div>
              </Card>
              <Card padding="sm" className="text-center">
                <div className="text-xl font-bold text-green-500">
                  {stats.paid}
                </div>
                <div className="text-xs text-[var(--tg-theme-hint-color)]">Оплат.</div>
              </Card>
              <Card padding="sm" className="text-center">
                <div className="text-xl font-bold text-yellow-500">
                  {stats.unpaid}
                </div>
                <div className="text-xs text-[var(--tg-theme-hint-color)]">Неопл.</div>
              </Card>
            </div>

            {/* Добавить ученика */}
            <Button fullWidth>+ Добавить ученика</Button>

            {/* Список учеников */}
            <div className="space-y-2">
              {students?.map((student) => (
                <Card key={student.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--tg-theme-text-color)]">
                        {student.telegramFirstName || student.telegramUsername || `ID: ${student.telegramId}`}
                      </p>
                      {student.telegramUsername && (
                        <p className="text-sm text-[var(--tg-theme-hint-color)]">
                          @{student.telegramUsername}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Badge
                        variant={student.invitationStatus === 'activated' ? 'info' : 'default'}
                        size="sm"
                      >
                        {student.invitationStatus === 'activated' ? 'Актив.' : 'Приглашён'}
                      </Badge>
                      <Badge
                        variant={student.paymentStatus === 'paid' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {student.paymentStatus === 'paid' ? 'Оплачено' : 'Не оплачено'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

