import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { Block } from './entities/block.entity';
import { Course } from './entities/course.entity';
import { CreateLessonDto, UpdateLessonDto, ReorderDto } from './dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  /**
   * Проверить, что блок принадлежит создателю
   */
  private async checkBlockOwnership(blockId: string, creatorId: string): Promise<Block> {
    const block = await this.blockRepository.findOne({
      where: { id: blockId },
      relations: ['course'],
    });

    if (!block) {
      throw new NotFoundException('Блок не найден');
    }

    if (block.course.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому блоку');
    }

    return block;
  }

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
   * Создать урок в блоке
   */
  async create(blockId: string, creatorId: string, dto: CreateLessonDto): Promise<Lesson> {
    await this.checkBlockOwnership(blockId, creatorId);

    // Получить максимальный displayOrder
    const maxOrder = await this.lessonRepository
      .createQueryBuilder('lesson')
      .where('lesson.blockId = :blockId', { blockId })
      .select('MAX(lesson.displayOrder)', 'max')
      .getRawOne();

    const lesson = this.lessonRepository.create({
      ...dto,
      blockId,
      displayOrder: (maxOrder?.max || 0) + 1,
    });

    return this.lessonRepository.save(lesson);
  }

  /**
   * Получить все уроки блока
   */
  async findAllByBlock(blockId: string): Promise<Lesson[]> {
    return this.lessonRepository.find({
      where: { blockId },
      relations: ['materials'],
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Получить урок по ID
   */
  async findOne(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['materials', 'block', 'block.course'],
    });

    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }

    return lesson;
  }

  /**
   * Обновить урок
   */
  async update(id: string, creatorId: string, dto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.checkLessonOwnership(id, creatorId);

    Object.assign(lesson, dto);
    return this.lessonRepository.save(lesson);
  }

  /**
   * Удалить урок
   */
  async remove(id: string, creatorId: string): Promise<void> {
    const lesson = await this.checkLessonOwnership(id, creatorId);
    await this.lessonRepository.remove(lesson);
  }

  /**
   * Изменить порядок уроков (drag-and-drop)
   */
  async reorder(blockId: string, creatorId: string, dto: ReorderDto): Promise<Lesson[]> {
    await this.checkBlockOwnership(blockId, creatorId);

    const lessons = await this.lessonRepository.find({
      where: { id: In(dto.orderedIds), blockId },
    });

    if (lessons.length !== dto.orderedIds.length) {
      throw new NotFoundException('Некоторые уроки не найдены');
    }

    // Обновить displayOrder для каждого урока
    for (let i = 0; i < dto.orderedIds.length; i++) {
      const lesson = lessons.find(l => l.id === dto.orderedIds[i]);
      if (lesson) {
        lesson.displayOrder = i;
      }
    }

    return this.lessonRepository.save(lessons);
  }

  /**
   * Переместить урок в другой блок
   */
  async moveToBlock(id: string, creatorId: string, newBlockId: string): Promise<Lesson> {
    const lesson = await this.checkLessonOwnership(id, creatorId);
    await this.checkBlockOwnership(newBlockId, creatorId);

    // Получить максимальный displayOrder в новом блоке
    const maxOrder = await this.lessonRepository
      .createQueryBuilder('lesson')
      .where('lesson.blockId = :blockId', { blockId: newBlockId })
      .select('MAX(lesson.displayOrder)', 'max')
      .getRawOne();

    lesson.blockId = newBlockId;
    lesson.displayOrder = (maxOrder?.max || 0) + 1;

    return this.lessonRepository.save(lesson);
  }
}


