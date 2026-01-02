import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
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
      accessToken: uuidv4(), // Генерируем уникальный токен
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
          accessToken: uuidv4(), // Генерируем уникальный токен
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
   * Найти поток по invite token
   * Ищем по любому токену без проверки isActive - 
   * студент должен иметь возможность активироваться по любой ссылке
   */
  async findStreamByInviteToken(inviteToken: string): Promise<Stream | null> {
    return this.streamRepository.findOne({
      where: { inviteToken },
      relations: ['course'],
    });
  }

  private readonly logger = new (require('@nestjs/common').Logger)(StreamStudentsService.name);

  /**
   * Активировать по invite token потока (создаёт студента если его нет)
   */
  async activateByStreamToken(inviteToken: string, telegramId: number, userId?: string, firstName?: string, lastName?: string, username?: string): Promise<StreamStudent> {
    this.logger.log(`[activateByStreamToken] inviteToken=${inviteToken}, telegramId=${telegramId}, userId=${userId}`);
    
    // Ищем поток по токену
    const stream = await this.findStreamByInviteToken(inviteToken);
    
    if (!stream) {
      this.logger.error(`[activateByStreamToken] Поток НЕ НАЙДЕН по токену: ${inviteToken}`);
      throw new NotFoundException('Недействительная ссылка приглашения');
    }

    this.logger.log(`[activateByStreamToken] Найден поток: id=${stream.id}, name=${stream.name}, courseId=${stream.courseId}`);

    // Проверяем, есть ли уже этот студент в потоке
    let student = await this.studentRepository.findOne({
      where: { streamId: stream.id, telegramId },
      relations: ['stream', 'stream.course', 'user'],
    });

    if (student) {
      this.logger.log(`[activateByStreamToken] Студент УЖЕ ЕСТЬ в потоке: studentId=${student.id}`);
      // Студент уже есть - активируем если ещё не активирован
      if (student.invitationStatus !== 'activated') {
        student.invitationStatus = 'activated';
        student.activatedAt = new Date();
        if (userId) student.userId = userId;
        await this.studentRepository.save(student);
      }
      return student;
    }

    this.logger.log(`[activateByStreamToken] Создаём НОВОГО студента в потоке ${stream.id}`);

    // Создаём нового студента
    student = this.studentRepository.create({
      streamId: stream.id,
      telegramId,
      telegramFirstName: firstName || 'Ученик',
      telegramLastName: lastName,
      telegramUsername: username,
      invitationStatus: 'activated',
      activatedAt: new Date(),
      paymentStatus: stream.price > 0 ? 'unpaid' : 'paid', // paid = бесплатный курс
      userId,
      accessToken: uuidv4(), // Генерируем уникальный токен
    });

    const savedStudent = await this.studentRepository.save(student);
    
    this.logger.log(`[activateByStreamToken] Студент СОЗДАН: id=${savedStudent.id}, streamId=${savedStudent.streamId}, accessToken=${savedStudent.accessToken}`);
    
    // Загружаем с relations
    return this.studentRepository.findOne({
      where: { id: savedStudent.id },
      relations: ['stream', 'stream.course', 'user'],
    }) as Promise<StreamStudent>;
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


