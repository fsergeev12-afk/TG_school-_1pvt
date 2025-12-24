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
    // Директория для локальных файлов (абсолютный путь)
    const uploadsDir = this.configService.get<string>('UPLOADS_DIR') || './uploads';
    this.uploadsDir = path.resolve(process.cwd(), uploadsDir);
    
    this.logger.log(`Директория uploads: ${this.uploadsDir}`);
    
    // Логируем наличие переменной хранилища
    const storageChannelId = this.configService.get<string>('TELEGRAM_STORAGE_CHANNEL_ID');
    this.logger.log(`TELEGRAM_STORAGE_CHANNEL_ID: ${storageChannelId ? 'настроен ✓' : 'НЕ НАСТРОЕН ✗'}`);
    
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
   * Загрузить видео урока в Telegram (в технический канал)
   */
  async uploadVideo(
    file: Express.Multer.File,
    _userId?: number, // Не используется, файлы идут в канал
  ): Promise<UploadResult> {
    this.validateFile(file, 'video');

    // ID технического канала для хранения файлов
    const storageChannelId = this.configService.get<string>('TELEGRAM_STORAGE_CHANNEL_ID');
    if (!storageChannelId) {
      throw new BadRequestException('Хранилище файлов не настроено (TELEGRAM_STORAGE_CHANNEL_ID)');
    }

    try {
      // Сохраняем во временный файл
      const tempPath = path.join(this.uploadsDir, 'temp', `${Date.now()}_${file.originalname}`);
      fs.writeFileSync(tempPath, file.buffer);

      // Отправляем в технический канал Telegram
      const bot = this.telegramBotService.getBot();
      const message = await bot.sendVideo(storageChannelId, tempPath, {
        caption: `🎬 ${file.originalname}`,
      });

      // Удаляем временный файл
      fs.unlinkSync(tempPath);

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
   * Загрузить материал урока в Telegram (в технический канал)
   */
  async uploadMaterial(
    file: Express.Multer.File,
    _userId?: number, // Не используется, файлы идут в канал
  ): Promise<UploadResult> {
    this.validateFile(file, 'material');

    // ID технического канала для хранения файлов
    const storageChannelId = this.configService.get<string>('TELEGRAM_STORAGE_CHANNEL_ID');
    if (!storageChannelId) {
      throw new BadRequestException('Хранилище файлов не настроено (TELEGRAM_STORAGE_CHANNEL_ID)');
    }

    try {
      // Сохраняем во временный файл
      const tempPath = path.join(this.uploadsDir, 'temp', `${Date.now()}_${file.originalname}`);
      fs.writeFileSync(tempPath, file.buffer);

      // Отправляем в технический канал Telegram
      const bot = this.telegramBotService.getBot();
      const message = await bot.sendDocument(storageChannelId, tempPath, {
        caption: `📄 ${file.originalname}`,
      });

      // Удаляем временный файл
      fs.unlinkSync(tempPath);

      const document = message.document;
      if (!document) {
        throw new Error('Не удалось получить document из ответа Telegram');
      }

      this.logger.log(`Материал загружен в Telegram: ${document.file_id}`);

      return {
        fileId: document.file_id,
        fileName: file.originalname,
        fileSize: document.file_size || file.size,
        mimeType: file.mimetype,
        storageType: 'telegram',
      };

    } catch (error) {
      this.logger.error(`Ошибка загрузки материала: ${error.message}`);
      throw new BadRequestException(`Ошибка загрузки файла. Проверьте настройки хранилища.`);
    }
  }

  /**
   * Получить URL файла из Telegram по file_id
   */
  async getTelegramFileUrl(fileId: string): Promise<string> {
    try {
      const bot = this.telegramBotService.getBot();
      const file = await bot.getFile(fileId);
      const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
      
      return `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    } catch (error) {
      this.logger.error(`Ошибка получения URL файла: ${error.message}`);
      throw new BadRequestException('Ошибка получения файла из Telegram');
    }
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


