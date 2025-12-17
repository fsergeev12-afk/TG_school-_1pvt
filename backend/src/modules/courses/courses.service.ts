import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto, UpdateCourseDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  /**
   * Создать новый курс
   * v3.0: Мультикурсовость без ограничений!
   */
  async create(creatorId: string, dto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepository.create({
      ...dto,
      creatorId,
      isPublished: false,
    });
    return this.courseRepository.save(course);
  }

  /**
   * Получить все курсы создателя
   */
  async findAllByCreator(creatorId: string): Promise<Course[]> {
    const courses = await this.courseRepository.find({
      where: { creatorId, deletedAt: IsNull() },
      relations: ['blocks', 'blocks.lessons'],
      order: { createdAt: 'DESC' },
    });

    // Сортируем блоки и уроки
    courses.forEach(course => {
      if (course.blocks) {
        course.blocks.sort((a, b) => a.displayOrder - b.displayOrder);
        course.blocks.forEach(block => {
          if (block.lessons) {
            block.lessons.sort((a, b) => a.displayOrder - b.displayOrder);
          }
        });
      }
    });

    return courses;
  }

  /**
   * Получить курс по ID
   */
  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['blocks', 'blocks.lessons', 'blocks.lessons.materials', 'creator'],
    });

    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    // Сортируем блоки и уроки
    if (course.blocks) {
      course.blocks.sort((a, b) => a.displayOrder - b.displayOrder);
      course.blocks.forEach(block => {
        if (block.lessons) {
          block.lessons.sort((a, b) => a.displayOrder - b.displayOrder);
        }
      });
    }

    return course;
  }

  /**
   * Получить курс по ID с проверкой владельца
   */
  async findOneByCreator(id: string, creatorId: string): Promise<Course> {
    const course = await this.findOne(id);

    if (course.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому курсу');
    }

    return course;
  }

  /**
   * Обновить курс
   */
  async update(id: string, creatorId: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOneByCreator(id, creatorId);

    Object.assign(course, dto);
    return this.courseRepository.save(course);
  }

  /**
   * Удалить курс (soft delete)
   */
  async remove(id: string, creatorId: string): Promise<void> {
    const course = await this.findOneByCreator(id, creatorId);

    course.deletedAt = new Date();
    await this.courseRepository.save(course);
  }

  /**
   * Опубликовать курс
   */
  async publish(id: string, creatorId: string): Promise<Course> {
    const course = await this.findOneByCreator(id, creatorId);

    course.isPublished = true;
    return this.courseRepository.save(course);
  }

  /**
   * Снять с публикации
   */
  async unpublish(id: string, creatorId: string): Promise<Course> {
    const course = await this.findOneByCreator(id, creatorId);

    course.isPublished = false;
    return this.courseRepository.save(course);
  }

  /**
   * Получить статистику курса
   */
  async getStats(id: string, creatorId: string): Promise<{
    blocksCount: number;
    lessonsCount: number;
  }> {
    const course = await this.findOneByCreator(id, creatorId);

    const blocksCount = course.blocks?.length || 0;
    const lessonsCount = course.blocks?.reduce(
      (sum, block) => sum + (block.lessons?.length || 0),
      0,
    ) || 0;

    return { blocksCount, lessonsCount };
  }
}

