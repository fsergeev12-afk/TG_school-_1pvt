import { useState } from 'react';

export default function PaymentScreen() {
  const [promoCode, setPromoCode] = useState('');

  const handleApplyPromo = () => {
    // TODO: Реализовать применение промокода
    console.log('Applying promo code:', promoCode);
  };

  return (
    <div className="min-h-screen bg-telegram-bg p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-telegram-text mb-6 text-center">
          💳 Оплата проекта
        </h1>

        {/* Информация о проекте */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="aspect-video bg-gray-200 rounded mb-4 flex items-center justify-center">
            <span className="text-gray-400">Иконка проекта</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Название проекта</h2>
          <p className="text-gray-600 mb-4">От: Имя создателя</p>
          <p className="text-sm text-gray-500">12 материалов в 3 разделах</p>
        </div>

        {/* Информация об оплате */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-lg font-semibold mb-4">Стоимость: 3,000₽</p>
          <button 
            disabled 
            className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg mb-4 cursor-not-allowed"
          >
            Оплатить (недоступно)
          </button>
          <p className="text-sm text-telegram-hint text-center">
            ℹ️ Реальные платежи пока не подключены
          </p>
        </div>

        {/* Промокод */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🎁 Есть промокод?</h3>
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Введите промокод"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
          />
          <button
            onClick={handleApplyPromo}
            className="w-full bg-telegram-button text-telegram-buttonText py-3 rounded-lg mb-2"
          >
            Применить
          </button>
          <p className="text-sm text-telegram-hint text-center">
            💡 Попробуйте: WELCOME
          </p>
        </div>
      </div>
    </div>
  );
}



