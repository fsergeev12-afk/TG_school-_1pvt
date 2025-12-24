import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Stream } from '../streams/entities/stream.entity';
import { StreamStudent } from '../streams/entities/stream-student.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(StreamStudent)
    private readonly studentRepository: Repository<StreamStudent>,
  ) {}

  /**
   * Получить или создать диалог
   */
  async getOrCreateConversation(
    creatorId: string,
    telegramChatId: number,
    telegramUserData?: {
      username?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<Conversation> {
    // Ищем существующий диалог
    let conversation = await this.conversationRepository.findOne({
      where: { creatorId, telegramChatId },
      relations: ['student', 'stream'],
    });

    if (!conversation) {
      // Создаём новый диалог
      conversation = this.conversationRepository.create({
        creatorId,
        telegramChatId,
        telegramUsername: telegramUserData?.username,
        telegramFirstName: telegramUserData?.firstName,
        telegramLastName: telegramUserData?.lastName,
        unreadCount: 0,
      });

      // Пытаемся найти студента по telegram_id
      const student = await this.studentRepository.findOne({
        where: { telegramId: telegramChatId },
        relations: ['stream'],
      });

      if (student && student.stream?.creatorId === creatorId) {
        conversation.studentId = student.id;
        conversation.streamId = student.streamId;
      }

      await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  /**
   * Получить все диалоги создателя
   */
  async findAllByCreator(creatorId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { creatorId },
      relations: ['student', 'stream'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  /**
   * Получить диалог по ID
   */
  async findOne(id: string, creatorId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['student', 'stream', 'messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Диалог не найден');
    }

    if (conversation.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому диалогу');
    }

    // Сортируем сообщения
    if (conversation.messages) {
      conversation.messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return conversation;
  }

  /**
   * Получить сообщения диалога
   */
  async getMessages(
    conversationId: string,
    creatorId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation || conversation.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа');
    }

    return this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Добавить входящее сообщение от ученика
   */
  async addIncomingMessage(
    creatorId: string,
    telegramChatId: number,
    text: string,
    telegramMessageId: number,
    telegramUserData?: {
      username?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<Message> {
    // Получаем или создаём диалог
    const conversation = await this.getOrCreateConversation(
      creatorId,
      telegramChatId,
      telegramUserData,
    );

    // Создаём сообщение
    const message = this.messageRepository.create({
      conversationId: conversation.id,
      senderType: 'student',
      text,
      telegramMessageId,
      isRead: false,
    });

    await this.messageRepository.save(message);

    // Обновляем диалог
    conversation.lastMessageAt = new Date();
    conversation.unreadCount += 1;

    // Обновляем данные Telegram если изменились
    if (telegramUserData?.username) {
      conversation.telegramUsername = telegramUserData.username;
    }
    if (telegramUserData?.firstName) {
      conversation.telegramFirstName = telegramUserData.firstName;
    }
    if (telegramUserData?.lastName) {
      conversation.telegramLastName = telegramUserData.lastName;
    }

    await this.conversationRepository.save(conversation);

    return message;
  }

  /**
   * Добавить исходящее сообщение от создателя
   */
  async addOutgoingMessage(
    conversationId: string,
    creatorId: string,
    text: string,
  ): Promise<Message> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation || conversation.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа');
    }

    const message = this.messageRepository.create({
      conversationId,
      senderType: 'creator',
      text,
      isRead: true, // Создатель сам написал, уже прочитано
    });

    await this.messageRepository.save(message);

    // Обновляем диалог
    conversation.lastMessageAt = new Date();
    await this.conversationRepository.save(conversation);

    return message;
  }

  /**
   * Отметить сообщения как прочитанные
   */
  async markAsRead(conversationId: string, creatorId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation || conversation.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа');
    }

    // Отмечаем все непрочитанные сообщения
    await this.messageRepository.update(
      { conversationId, isRead: false, senderType: 'student' },
      { isRead: true },
    );

    // Сбрасываем счётчик
    conversation.unreadCount = 0;
    await this.conversationRepository.save(conversation);
  }

  /**
   * Получить количество непрочитанных диалогов
   */
  async getUnreadCount(creatorId: string): Promise<number> {
    const result = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.creatorId = :creatorId', { creatorId })
      .andWhere('conversation.unreadCount > 0')
      .getCount();

    return result;
  }

  /**
   * Привязать диалог к ученику
   */
  async linkToStudent(
    conversationId: string,
    creatorId: string,
    studentId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation || conversation.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа');
    }

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['stream'],
    });

    if (!student || student.stream?.creatorId !== creatorId) {
      throw new NotFoundException('Ученик не найден');
    }

    conversation.studentId = studentId;
    conversation.streamId = student.streamId;

    return this.conversationRepository.save(conversation);
  }

  /**
   * Найти диалог по telegram chat_id
   */
  async findByTelegramChatId(
    creatorId: string,
    telegramChatId: number,
  ): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { creatorId, telegramChatId },
      relations: ['student', 'stream'],
    });
  }
}


