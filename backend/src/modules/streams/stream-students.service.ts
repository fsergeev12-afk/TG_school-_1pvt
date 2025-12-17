import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StreamStudent } from './entities/stream-student.entity';
import { Stream } from './entities/stream.entity';
import { AddStudentDto, BulkAddStudentsDto } from './dto';

@Injectable()
export class StreamStudentsService {
  constructor(
    @InjectRepository(StreamStudent)
    private readonly studentRepository: Repository<StreamStudent>,
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
  ) {}

  /**
   * Проверить, что поток принадлежит создателю
   */
  private async checkStreamOwnership(streamId: string, creatorId: string): Promise<Stream> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId },
    });

    if (!stream) {
      throw new NotFoundException('Поток не найден');
    }

    if (stream.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому потоку');
    }

    return stream;
  }

  /**
   * Добавить ученика в поток
   */
  async addStudent(streamId: string, creatorId: string, dto: AddStudentDto): Promise<StreamStudent> {
    await this.checkStreamOwnership(streamId, creatorId);

    // Проверяем, нет ли уже этого ученика в потоке
    const existing = await this.studentRepository.findOne({
      where: { streamId, telegramId: dto.telegramId },
    });

    if (existing) {
      throw new ConflictException('Этот ученик уже добавлен в поток');
    }

    const student = this.studentRepository.create({
      streamId,
      telegramId: dto.telegramId,
      telegramUsername: dto.telegramUsername,
      telegramFirstName: dto.telegramFirstName,
      telegramLastName: dto.telegramLastName,
      invitationStatus: 'invited',
      paymentStatus: 'unpaid',
    });

    return this.studentRepository.save(student);
  }

  /**
   * Массовое добавление учеников
   */
  async bulkAddStudents(streamId: string, creatorId: string, dto: BulkAddStudentsDto): Promise<{
    added: number;
    skipped: number;
  }> {
    await this.checkStreamOwnership(streamId, creatorId);

    let added = 0;
    let skipped = 0;

    for (const telegramId of dto.telegramIds) {
      try {
        const existing = await this.studentRepository.findOne({
          where: { streamId, telegramId },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const student = this.studentRepository.create({
          streamId,
          telegramId,
          invitationStatus: 'invited',
          paymentStatus: 'unpaid',
        });

        await this.studentRepository.save(student);
        added++;
      } catch {
        skipped++;
      }
    }

    return { added, skipped };
  }

  /**
   * Получить всех учеников потока
   */
  async findByStream(streamId: string, creatorId: string): Promise<StreamStudent[]> {
    await this.checkStreamOwnership(streamId, creatorId);

    return this.studentRepository.find({
      where: { streamId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Найти ученика по access_token
   */
  async findByAccessToken(accessToken: string): Promise<StreamStudent | null> {
    return this.studentRepository.findOne({
      where: { accessToken },
      relations: ['stream', 'stream.course', 'user'],
    });
  }

  /**
   * Найти ученика по ID
   */
  async findOne(id: string): Promise<StreamStudent> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['stream', 'user'],
    });

    if (!student) {
      throw new NotFoundException('Ученик не найден');
    }

    return student;
  }

  /**
   * Активировать ученика (после перехода по ссылке)
   */
  async activate(accessToken: string, telegramId: number, userId?: string): Promise<StreamStudent> {
    const student = await this.findByAccessToken(accessToken);

    if (!student) {
      throw new NotFoundException('Недействительная ссылка приглашения');
    }

    // Защита от складчины: проверяем telegram_id
    if (student.telegramId !== telegramId) {
      throw new ForbiddenException('Эта ссылка предназначена для другого пользователя');
    }

    // Уже активирован?
    if (student.invitationStatus === 'activated') {
      return student;
    }

    student.invitationStatus = 'activated';
    student.activatedAt = new Date();
    
    if (userId) {
      student.userId = userId;
    }

    return this.studentRepository.save(student);
  }

  /**
   * Отметить оплату ученика
   */
  async markPaid(id: string, creatorId: string, paymentId?: string): Promise<StreamStudent> {
    const student = await this.findOne(id);
    await this.checkStreamOwnership(student.streamId, creatorId);

    student.paymentStatus = 'paid';
    student.paidAt = new Date();
    
    if (paymentId) {
      student.paymentId = paymentId;
    }

    return this.studentRepository.save(student);
  }

  /**
   * Удалить ученика из потока
   */
  async remove(id: string, creatorId: string): Promise<void> {
    const student = await this.findOne(id);
    await this.checkStreamOwnership(student.streamId, creatorId);

    await this.studentRepository.remove(student);
  }

  /**
   * Получить статистику учеников потока
   */
  async getStudentStats(streamId: string, creatorId: string): Promise<{
    total: number;
    invited: number;
    activated: number;
    paid: number;
    unpaid: number;
  }> {
    await this.checkStreamOwnership(streamId, creatorId);

    const students = await this.studentRepository.find({
      where: { streamId },
    });

    return {
      total: students.length,
      invited: students.filter(s => s.invitationStatus === 'invited').length,
      activated: students.filter(s => s.invitationStatus === 'activated').length,
      paid: students.filter(s => s.paymentStatus === 'paid').length,
      unpaid: students.filter(s => s.paymentStatus === 'unpaid').length,
    };
  }

  /**
   * Генерация ссылки приглашения для ученика
   */
  getInviteLink(student: StreamStudent, botUsername: string): string {
    // Deep link формат: https://t.me/BOT_USERNAME?start=TOKEN
    return `https://t.me/${botUsername}?start=${student.accessToken}`;
  }
}

