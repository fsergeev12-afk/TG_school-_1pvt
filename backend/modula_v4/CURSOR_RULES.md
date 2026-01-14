# Cursor Rules — Modula v4.0 Desert Sunset

## Дизайн-система: Alto's Odyssey Palette

---

## 🎨 ЦВЕТА

### Фон (градиент сверху вниз)
```
#C9B8D4  — Лавандовый (верх)
#D4C4D4  — Пудровый (середина)  
#E8DCD8  — Песочный (низ)
```

### Основные цвета
```
#3D2E4A  — Text Dark (заголовки, основной текст)
#5B4A6A  — Text Medium (подзаголовки)
#6B5A7A  — Purple Main (активные элементы, nav)
#8B7A9A  — Text Secondary (описания, hints)
#A090B0  — Text Muted (неактивные элементы)
```

### Акценты
```
#D4956A  — Terracotta CTA (главные кнопки)
#C4855A  — Terracotta Dark (градиент кнопок)
#B8A8C8  — Lavender Light (подсветка)
```

### Карточки
```
rgba(255,255,255,0.8)   — Активная карточка
rgba(255,255,255,0.6)   — Обычная карточка
rgba(255,255,255,0.4)   — Черновик/неактивная
```

### Семантика
```
#10B981  — Success (emerald-500)
#EF4444  — Error (red-500)
#F59E0B  — Warning (amber-500)
```

---

## 📐 РАЗМЕРЫ

### Кнопки
```
h-14 (56px)  — CTA кнопки
h-12 (48px)  — Вторичные кнопки
h-10 (40px)  — Мелкие кнопки, back
```

### Скругления
```
rounded-2xl (16px)  — Карточки, кнопки, аватарки
rounded-xl (12px)   — Инпуты, табы, мелкие элементы
rounded-lg (8px)    — Бейджи, теги
rounded-full        — Dots, badges count
```

### Отступы
```
p-5   — Padding экрана
gap-2.5  — Между карточками
gap-4    — Между секциями
mb-5/6   — Между блоками
```

---

## 🔤 ТИПОГРАФИКА

```jsx
// Display
className="text-[26px] font-bold tracking-tight"
style={{ color: '#3D2E4A' }}

// Page title  
className="text-[18px] font-bold"
style={{ color: '#3D2E4A' }}

// Card title
className="text-[16px] font-semibold"
style={{ color: '#3D2E4A' }}

// Body
className="text-[14px]"
style={{ color: '#5B4A6A' }}

// Secondary
className="text-[13px]"
style={{ color: '#8B7A9A' }}

// Label
className="text-[11px] font-medium uppercase tracking-wide"
style={{ color: '#8B7A9A' }}

// Small
className="text-[10px] font-semibold"
```

---

## 🌫️ ТЕНИ

```css
.shadow-soft {
  box-shadow: 0 2px 8px rgba(107,91,122,0.1);
}

.shadow-card {
  box-shadow: 0 4px 20px rgba(107,91,122,0.15);
}
```

---

## 🧩 КОМПОНЕНТЫ

### Фон страницы
```jsx
style={{ background: 'linear-gradient(180deg, #C9B8D4 0%, #D4C4D4 40%, #E8DCD8 100%)' }}
```

### CTA Button
```jsx
<button 
  className="w-full h-14 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 shadow-card text-white"
  style={{ background: 'linear-gradient(135deg, #D4956A, #C4855A)' }}
>
  + Создать проект
</button>
```

### Карточка активная
```jsx
<div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-card relative overflow-hidden">
  {/* Accent line */}
  <div className="absolute top-0 left-0 right-0 h-1" 
       style={{ background: 'linear-gradient(90deg, #C9B8D4, #D4956A, #C9B8D4)' }} />
  {/* Content */}
</div>
```

### Карточка обычная
```jsx
<div className="bg-white/60 backdrop-blur rounded-2xl p-4 shadow-soft">
  {/* Content */}
</div>
```

### Аватарка нейтральная
```jsx
<div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[14px] font-semibold"
     style={{ background: 'linear-gradient(145deg, #E8DCD8, #D4C4D4)', color: '#6B5A7A' }}>
  АК
</div>
```

### Аватарка акцентная (непрочитанные)
```jsx
<div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[14px] font-semibold"
     style={{ background: 'linear-gradient(145deg, #C9B8D4, #B8A8C8)', color: 'white' }}>
  АК
</div>
```

### Аватарка профиль (тёмная)
```jsx
<div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold shadow-card"
     style={{ background: 'linear-gradient(145deg, #5B4A6A, #4A3D5A)', color: '#D4C4D4' }}>
  ФС
</div>
```

### Input
```jsx
<input 
  className="w-full h-12 px-4 rounded-2xl bg-white/70 backdrop-blur text-[14px] border-0 shadow-soft"
  style={{ color: '#3D2E4A' }}
  placeholder="Поиск..."
/>
// placeholder color: #A090B0
```

### Tabs
```jsx
<div className="flex gap-1 bg-white/50 backdrop-blur rounded-2xl p-1.5">
  {/* Active */}
  <button className="flex-1 h-10 rounded-xl text-white text-[13px] font-semibold"
          style={{ background: 'linear-gradient(135deg, #6B5A7A, #5B4A6A)' }}>
    Описание
  </button>
  {/* Inactive */}
  <button className="flex-1 h-10 rounded-xl text-[13px] font-medium"
          style={{ color: '#8B7A9A' }}>
    Ученики
  </button>
</div>
```

### Bottom Navigation
```jsx
<div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4"
     style={{ background: 'linear-gradient(to top, #E8DCD8 60%, transparent 100%)' }}>
  <div className="flex justify-around bg-white/90 backdrop-blur rounded-2xl p-1.5 shadow-card">
    {/* Active */}
    <button className="flex flex-col items-center min-w-[72px] py-2.5 px-4 rounded-xl text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #6B5A7A, #5B4A6A)' }}>
      <IconComponent className="w-6 h-6" />
      <span className="text-[10px] mt-1 font-semibold">Проекты</span>
    </button>
    {/* Inactive */}
    <button className="flex flex-col items-center min-w-[72px] py-2.5 px-4 rounded-xl"
            style={{ color: '#A090B0' }}>
      <IconComponent className="w-6 h-6" />
      <span className="text-[10px] mt-1 font-medium">Потоки</span>
    </button>
  </div>
</div>
```

### Badge непрочитанных
```jsx
<span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
      style={{ background: '#D4956A' }}>
  3
</span>
```

### Status Live
```jsx
<span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ background: 'rgba(16,185,129,0.1)' }}>
  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
  <span className="text-[10px] font-semibold uppercase text-emerald-700">Live</span>
</span>
```

### Accent bar (непрочитанные)
```jsx
<div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full" 
     style={{ background: '#D4956A' }} />
```

---

## 📱 MOBILE-FIRST

```
- Touch targets: минимум 44px (h-10+)
- Кнопки CTA: 56px (h-14)
- Safe area: pb-6 для bottom nav
- Viewport: 100dvh
- Font min: 10px
```

---

## ✅ ЧЕКЛИСТ

```
[ ] Градиентный фон (не белый)
[ ] Полупрозрачные карточки (backdrop-blur)
[ ] SVG иконки (не эмодзи)
[ ] Терракотовые CTA кнопки
[ ] Фиолетовая активная навигация
[ ] Accent bar слева для непрочитанных
[ ] Кнопки h-14 (56px)
[ ] Unified avatars
```
