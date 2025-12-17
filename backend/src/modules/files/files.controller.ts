import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('files')
@UseGuards(TelegramAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Получить информацию о лимитах файлов
   * GET /api/files/limits
   */
  @Get('limits')
  getLimits() {
    return this.filesService.getFileLimits();
  }

  /**
   * Загрузить обложку курса
   * POST /api/files/cover/:courseId
   */
  @Post('cover/:courseId')
  @Roles('creator', 'admin')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadCover(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    return this.filesService.uploadCover(file, courseId);
  }

  /**
   * Загрузить видео урока
   * POST /api/files/video
   */
  @Post('video')
  @Roles('creator', 'admin')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  }))
  async uploadVideo(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    // Используем telegram_id создателя для загрузки
    return this.filesService.uploadVideo(file, user.telegramId);
  }

  /**
   * Загрузить материал урока
   * POST /api/files/material
   */
  @Post('material')
  @Roles('creator', 'admin')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  }))
  async uploadMaterial(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    return this.filesService.uploadMaterial(file, user.telegramId);
  }

  /**
   * Получить URL файла из Telegram
   * GET /api/files/telegram/:fileId
   */
  @Get('telegram/:fileId')
  async getTelegramFileUrl(@Param('fileId') fileId: string) {
    const url = await this.filesService.getTelegramFileUrl(fileId);
    return { url };
  }
}

