import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Включаем CORS для frontend
  app.enableCors({
    origin: true,
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

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`
  🚀 Backend запущен на http://localhost:${port}
  📚 API доступен на http://localhost:${port}/api
  📁 Файлы доступны на http://localhost:${port}/uploads/
  🗄️  База данных: ${process.env.DATABASE_TYPE || 'sqlite'}
  `);
}

bootstrap();



