import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Результат загрузки файла
 */
export interface UploadResult {
  fileId: string; // Telegram file_id или локальный путь
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageType: 'telegram' | 'local';
  url?: string; // URL для доступа (если локальный)
}

/**
 * Ограничения файлов
 */
const FILE_LIMITS = {
  // Обложки курсов
  cover: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  // Видео уроков
  video: {
    maxSize: 50 * 1024 * 1024, // 50MB (лимит Telegram)
    allowedTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
    extensions: ['.mp4', '.mov', '.webm'],
  },
  // Материалы к урокам
  material: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.pdf', '.doc', '.docx'],
  },
};

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadsDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramBotService: TelegramBotService,
  ) {
    // Директория для локальных файлов (обложки)
    this.uploadsDir = this.configService.get<string>('UPLOADS_DIR') || './uploads';
    
    // Создаём директории если не существуют
    this.ensureDirectories();
  }

  /**
   * Создать необходимые директории
   */
  private ensureDirectories() {
    const dirs = ['covers', 'temp', 'materials'];
    for (const dir of dirs) {
      const fullPath = path.join(this.uploadsDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.logger.log(`Создана директория: ${fullPath}`);
      }
    }
  }

  /**
   * Валидация файла
   */
  validateFile(
    file: Express.Multer.File,
    type: 'cover' | 'video' | 'material',
  ): void {
    const limits = FILE_LIMITS[type];

    // Проверка размера
    if (file.size > limits.maxSize) {
      const maxMB = Math.round(limits.maxSize / 1024 / 1024);
      throw new BadRequestException(`Файл слишком большой. Максимум: ${maxMB}MB`);
    }

    // Проверка типа
    if (!limits.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Недопустимый тип файла. Разрешены: ${limits.extensions.join(', ')}`,
      );
    }

    // Проверка расширения
    const ext = path.extname(file.originalname).toLowerCase();
    if (!limits.extensions.includes(ext)) {
      throw new BadRequestException(
        `Недопустимое расширение файла. Разрешены: ${limits.extensions.join(', ')}`,
      );
    }
  }

  /**
   * Загрузить обложку курса (локально)
   */
  async uploadCover(
    file: Express.Multer.File,
    courseId: string,
  ): Promise<UploadResult> {
    this.validateFile(file, 'cover');

    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${courseId}${ext}`;
    const filePath = path.join(this.uploadsDir, 'covers', fileName);

    // Сохраняем файл
    fs.writeFileSync(filePath, file.buffer);

    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';

    return {
      fileId: fileName,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageType: 'local',
      url: `${baseUrl}/uploads/covers/${fileName}`,
    };
  }

  /**
   * Загрузить видео урока в Telegram
   */
  async uploadVideo(
    file: Express.Multer.File,
    chatId: number,
  ): Promise<UploadResult> {
    this.validateFile(file, 'video');

    try {
      // Сохраняем во временный файл
      const tempPath = path.join(this.uploadsDir, 'temp', `${Date.now()}_${file.originalname}`);
      fs.writeFileSync(tempPath, file.buffer);

      // Отправляем в Telegram и получаем file_id
      const bot = this.telegramBotService.getBot();
      const message = await bot.sendVideo(chatId, tempPath, {
        caption: 'Загрузка видео...',
      });

      // Удаляем временный файл
      fs.unlinkSync(tempPath);

      // Удаляем сообщение из чата (оно было только для загрузки)
      try {
        await bot.deleteMessage(chatId, message.message_id);
      } catch {
        // Игнорируем ошибку удаления
      }

      const video = message.video;
      if (!video) {
        throw new Error('Не удалось получить video из ответа Telegram');
      }

      return {
        fileId: video.file_id,
        fileName: file.originalname,
        fileSize: video.file_size || file.size,
        mimeType: file.mimetype,
        storageType: 'telegram',
      };

    } catch (error) {
      this.logger.error(`Ошибка загрузки видео: ${error.message}`);
      throw new BadRequestException('Ошибка загрузки видео в Telegram');
    }
  }

  /**
   * Загрузить материал урока (локально)
   */
  async uploadMaterial(
    file: Express.Multer.File,
    _chatId?: number, // Больше не используется, сохраняем для совместимости
  ): Promise<UploadResult> {
    this.validateFile(file, 'material');

    try {
      // Генерируем уникальное имя файла
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const fileName = `${uniqueId}${ext}`;
      const filePath = path.join(this.uploadsDir, 'materials', fileName);

      // Сохраняем файл
      fs.writeFileSync(filePath, file.buffer);

      const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';

      this.logger.log(`Материал сохранён: ${filePath}`);

      return {
        fileId: fileName, // Используем имя файла как ID
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storageType: 'local',
        url: `${baseUrl}/uploads/materials/${fileName}`,
      };

    } catch (error) {
      this.logger.error(`Ошибка загрузки материала: ${error.message}`);
      throw new BadRequestException('Ошибка сохранения материала');
    }
  }

  /**
   * Получить URL файла по ID
   * Поддерживает как локальные файлы, так и Telegram file_id
   */
  async getFileUrl(fileId: string): Promise<string> {
    // Проверяем, является ли это локальным файлом (имеет расширение)
    const localExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm'];
    const isLocalFile = localExtensions.some(ext => fileId.toLowerCase().endsWith(ext));

    if (isLocalFile) {
      // Локальный файл
      const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
      return `${baseUrl}/uploads/materials/${fileId}`;
    }

    // Telegram file_id
    try {
      const bot = this.telegramBotService.getBot();
      const file = await bot.getFile(fileId);
      const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
      
      return `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    } catch (error) {
      this.logger.error(`Ошибка получения URL файла: ${error.message}`);
      throw new BadRequestException('Ошибка получения файла');
    }
  }

  /**
   * @deprecated Use getFileUrl instead
   */
  async getTelegramFileUrl(fileId: string): Promise<string> {
    return this.getFileUrl(fileId);
  }

  /**
   * Удалить локальный файл
   */
  deleteLocalFile(fileName: string, type: 'cover' | 'material'): void {
    const folder = type === 'cover' ? 'covers' : 'materials';
    const filePath = path.join(this.uploadsDir, folder, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`Удалён файл: ${filePath}`);
    }
  }

  /**
   * Получить информацию о лимитах
   */
  getFileLimits() {
    return {
      cover: {
        maxSizeMB: FILE_LIMITS.cover.maxSize / 1024 / 1024,
        allowedExtensions: FILE_LIMITS.cover.extensions,
      },
      video: {
        maxSizeMB: FILE_LIMITS.video.maxSize / 1024 / 1024,
        allowedExtensions: FILE_LIMITS.video.extensions,
      },
      material: {
        maxSizeMB: FILE_LIMITS.material.maxSize / 1024 / 1024,
        allowedExtensions: FILE_LIMITS.material.extensions,
      },
    };
  }
}


