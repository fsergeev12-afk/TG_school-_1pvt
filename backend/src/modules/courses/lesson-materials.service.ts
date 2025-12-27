import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonMaterial } from './entities/lesson-material.entity';
import { Lesson } from './entities/lesson.entity';

export interface AddMaterialDto {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
}

@Injectable()
export class LessonMaterialsService {
  constructor(
    @InjectRepository(LessonMaterial)
    private readonly materialRepository: Repository<LessonMaterial>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
  ) {}

  /**
   * Проверить, что урок принадлежит создателю
   */
  private async checkLessonOwnership(lessonId: string, creatorId: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['block', 'block.course'],
    });

    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }

    if (lesson.block.course.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому уроку');
    }

    return lesson;
  }

  /**
   * Добавить материал к уроку
   */
  async addMaterial(
    lessonId: string,
    creatorId: string,
    dto: AddMaterialDto,
  ): Promise<LessonMaterial> {
    await this.checkLessonOwnership(lessonId, creatorId);

    // Получить максимальный displayOrder
    const maxOrder = await this.materialRepository
      .createQueryBuilder('material')
      .where('material.lessonId = :lessonId', { lessonId })
      .select('MAX(material.displayOrder)', 'max')
      .getRawOne();

    const material = this.materialRepository.create({
      lessonId,
      telegramFileId: dto.fileId,
      fileName: dto.fileName,
      fileType: dto.fileType,
      fileSizeBytes: dto.fileSizeBytes,
      displayOrder: (maxOrder?.max || 0) + 1,
    });

    return this.materialRepository.save(material);
  }

  /**
   * Получить все материалы урока
   */
  async getMaterials(lessonId: string): Promise<LessonMaterial[]> {
    return this.materialRepository.find({
      where: { lessonId },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Удалить материал
   */
  async removeMaterial(
    lessonId: string,
    materialId: string,
    creatorId: string,
  ): Promise<void> {
    await this.checkLessonOwnership(lessonId, creatorId);

    const material = await this.materialRepository.findOne({
      where: { id: materialId, lessonId },
    });

    if (!material) {
      throw new NotFoundException('Материал не найден');
    }

    await this.materialRepository.remove(material);
  }
}


