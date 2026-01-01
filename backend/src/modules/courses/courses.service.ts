import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Course } from './entities/course.entity';
import { Stream } from '../streams/entities/stream.entity';
import { CreateCourseDto, UpdateCourseDto } from './dto';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
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
   * Получить количество потоков для курса
   */
  async getStreamsCount(id: string, creatorId: string): Promise<number> {
    await this.findOneByCreator(id, creatorId);
    return this.streamRepository.count({ where: { courseId: id } });
  }

  /**
   * Удалить курс и все связанные потоки (soft delete для курса, hard delete для потоков)
   */
  async remove(id: string, creatorId: string): Promise<{ deletedStreams: number }> {
    const course = await this.findOneByCreator(id, creatorId);

    // Удаляем все потоки курса
    const streams = await this.streamRepository.find({ where: { courseId: id } });
    const deletedStreams = streams.length;
    
    if (deletedStreams > 0) {
      this.logger.log(`Удаляем ${deletedStreams} потоков для курса ${id}`);
      await this.streamRepository.remove(streams);
    }

    // Soft delete курса
    course.deletedAt = new Date();
    await this.courseRepository.save(course);

    return { deletedStreams };
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

