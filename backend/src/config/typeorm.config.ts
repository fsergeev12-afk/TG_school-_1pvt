import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

// Конфигурация TypeORM для SQLite (локальная разработка)
// Легко перейти на PostgreSQL позже!

const isSQLite = process.env.DATABASE_TYPE === 'sqlite' || !process.env.DATABASE_TYPE;

// SQLite конфигурация (для локальной разработки и Railway)
const sqliteConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: process.env.DATABASE_NAME || 'database.sqlite',
  synchronize: true, // Для SQLite всегда true (MVP)
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
};

// PostgreSQL конфигурация (для продакшена)
const postgresConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'telegram_course_platform',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
};

// Экспортируем нужную конфигурацию
export const typeOrmConfig = isSQLite ? sqliteConfig : postgresConfig;

// DataSource для миграций
export const AppDataSource = new DataSource(typeOrmConfig as DataSourceOptions);



