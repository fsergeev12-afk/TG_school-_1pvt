import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Включаем CORS для frontend
  app.enableCors({
    origin: true, // Разрешаем все origins для тестирования
    credentials: true,
  });

  // Включаем валидацию DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Статические файлы (uploads)
  const uploadsDir = process.env.UPLOADS_DIR || './uploads';
  app.useStaticAssets(join(process.cwd(), uploadsDir), {
    prefix: '/uploads/',
  });

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Слушаем на всех интерфейсах

  console.log(`
  🚀 Backend запущен на http://localhost:${port}
  📚 API доступен на http://localhost:${port}/api
  📁 Файлы доступны на http://localhost:${port}/uploads/
  🗄️  База данных: ${process.env.DATABASE_TYPE || 'sqlite'}
  `);
}

bootstrap();



