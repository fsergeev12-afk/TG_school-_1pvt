import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Создать нового пользователя
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  /**
   * Найти пользователя по Telegram ID
   */
  async findByTelegramId(telegramId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { telegramId },
    });
  }

  /**
   * Найти или создать пользователя по Telegram ID
   */
  async findOrCreateByTelegram(
    telegramId: number,
    firstName: string,
    lastName?: string,
    username?: string,
  ): Promise<User> {
    let user = await this.findByTelegramId(telegramId);
    
    if (!user) {
      user = await this.create({
        telegramId,
        firstName,
        lastName,
        telegramUsername: username,
        role: 'student', // По умолчанию студент
      });
    }
    
    return user;
  }

  /**
   * Найти пользователя по ID
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    return user;
  }

  /**
   * Найти всех пользователей (для админки, позже)
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * Обновить роль пользователя
   */
  async updateRole(id: string, role: string): Promise<User> {
    const user = await this.findOne(id);
    user.role = role;
    return await this.userRepository.save(user);
  }

  /**
   * Обновить данные пользователя
   */
  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  /**
   * Удалить пользователя
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}


