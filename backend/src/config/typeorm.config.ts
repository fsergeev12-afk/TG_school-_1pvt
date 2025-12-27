import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

// Конфигурация TypeORM
// Автоматически использует PostgreSQL если есть DATABASE_URL (Railway)
// Иначе SQLite для локальной разработки

const databaseUrl = process.env.DATABASE_URL;
const usePostgres = !!databaseUrl;

// SQLite конфигурация (для локальной разработки)
const sqliteConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: process.env.DATABASE_NAME || 'database.sqlite',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
};

// PostgreSQL конфигурация (Railway — через DATABASE_URL)
const postgresConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: databaseUrl, // Railway предоставляет полный URL
  synchronize: true, // Для MVP — автосоздание таблиц
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
  ssl: databaseUrl?.includes('railway') ? { rejectUnauthorized: false } : false, // SSL для Railway
};

// Экспортируем нужную конфигурацию
export const typeOrmConfig = usePostgres ? postgresConfig : sqliteConfig;

// Логируем какую БД используем
console.log(`[Database] Using ${usePostgres ? 'PostgreSQL (Railway)' : 'SQLite (local)'}`);

// DataSource для миграций
export const AppDataSource = new DataSource(typeOrmConfig as DataSourceOptions);



