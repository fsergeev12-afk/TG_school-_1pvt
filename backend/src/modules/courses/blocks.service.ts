import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Block } from './entities/block.entity';
import { Course } from './entities/course.entity';
import { CreateBlockDto, UpdateBlockDto, ReorderDto } from './dto';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  /**
   * Проверить, что курс принадлежит создателю
   */
  private async checkCourseOwnership(courseId: string, creatorId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    if (course.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому курсу');
    }

    return course;
  }

  /**
   * Создать блок в курсе
   */
  async create(courseId: string, creatorId: string, dto: CreateBlockDto): Promise<Block> {
    await this.checkCourseOwnership(courseId, creatorId);

    // Получить максимальный displayOrder
    const maxOrder = await this.blockRepository
      .createQueryBuilder('block')
      .where('block.courseId = :courseId', { courseId })
      .select('MAX(block.displayOrder)', 'max')
      .getRawOne();

    const block = this.blockRepository.create({
      ...dto,
      courseId,
      displayOrder: (maxOrder?.max || 0) + 1,
    });

    return this.blockRepository.save(block);
  }

  /**
   * Получить все блоки курса с уроками (отсортированными)
   */
  async findAllByCourse(courseId: string): Promise<Block[]> {
    const blocks = await this.blockRepository.find({
      where: { courseId },
      relations: ['lessons', 'lessons.materials'],
      order: { displayOrder: 'ASC' },
    });

    // Сортируем уроки внутри каждого блока
    blocks.forEach(block => {
      if (block.lessons) {
        block.lessons.sort((a, b) => a.displayOrder - b.displayOrder);
      }
    });

    return blocks;
  }

  /**
   * Получить блок по ID
   */
  async findOne(id: string): Promise<Block> {
    const block = await this.blockRepository.findOne({
      where: { id },
      relations: ['lessons', 'course'],
    });

    if (!block) {
      throw new NotFoundException('Блок не найден');
    }

    return block;
  }

  /**
   * Обновить блок
   */
  async update(id: string, creatorId: string, dto: UpdateBlockDto): Promise<Block> {
    const block = await this.findOne(id);
    await this.checkCourseOwnership(block.courseId, creatorId);

    Object.assign(block, dto);
    return this.blockRepository.save(block);
  }

  /**
   * Удалить блок
   */
  async remove(id: string, creatorId: string): Promise<void> {
    const block = await this.findOne(id);
    await this.checkCourseOwnership(block.courseId, creatorId);

    await this.blockRepository.remove(block);
  }

  /**
   * Изменить порядок блоков (drag-and-drop)
   */
  async reorder(courseId: string, creatorId: string, dto: ReorderDto): Promise<Block[]> {
    await this.checkCourseOwnership(courseId, creatorId);

    const blocks = await this.blockRepository.find({
      where: { id: In(dto.orderedIds), courseId },
    });

    if (blocks.length !== dto.orderedIds.length) {
      throw new NotFoundException('Некоторые блоки не найдены');
    }

    // Обновить displayOrder для каждого блока
    for (let i = 0; i < dto.orderedIds.length; i++) {
      const block = blocks.find(b => b.id === dto.orderedIds[i]);
      if (block) {
        block.displayOrder = i;
      }
    }

    return this.blockRepository.save(blocks);
  }
}

