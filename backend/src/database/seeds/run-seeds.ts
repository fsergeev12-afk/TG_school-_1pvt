import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../../config/typeorm.config';
import { PromoCode } from '../../modules/promo-codes/entities/promo-code.entity';

async function runSeeds() {
  console.log('🌱 Запуск seed данных...');

  const dataSource = new DataSource(typeOrmConfig as any);
  await dataSource.initialize();

  const promoCodeRepository = dataSource.getRepository(PromoCode);

  // Создаем дефолтный промокод "WELCOME"
  const welcomePromo = await promoCodeRepository.findOne({
    where: { code: 'WELCOME' },
  });

  if (!welcomePromo) {
    await promoCodeRepository.save({
      code: 'WELCOME',
      type: 'free',
      isActive: true,
      usageLimit: null, // безлимитный
      usedCount: 0,
    });
    console.log('✅ Промокод "WELCOME" создан');
  } else {
    console.log('ℹ️  Промокод "WELCOME" уже существует');
  }

  await dataSource.destroy();
  console.log('🌱 Seed данные загружены успешно!');
}

runSeeds().catch((error) => {
  console.error('❌ Ошибка при загрузке seed данных:', error);
  process.exit(1);
});



