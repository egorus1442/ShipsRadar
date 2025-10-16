# 🚀 Quick Start - ShipsRadar Stage 3

## ✨ НИКАКИХ API КЛЮЧЕЙ НЕ ТРЕБУЕТСЯ!

Все работает из коробки:
- ✅ **Leaflet** карты (бесплатно)
- ✅ **Nominatim** геокодинг (бесплатно, OpenStreetMap)
- ✅ Парсинг координат
- ✅ Автокомплит
- ✅ Reverse geocoding

---

## Запуск за 3 шага:

### 1️⃣ Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

✅ Backend запустится на http://localhost:8000

### 2️⃣ Frontend
```bash
cd frontend
npm install
npm run dev
```

✅ Frontend запустится на http://localhost:5173

### 3️⃣ Готово!
Откройте http://localhost:5173 в браузере

---

## Что можно протестировать:

### ✅ Парсинг координат
Введите в Start Point:
```
1.3521, 103.8198
```
Координаты автоматически распарсятся!

### ✅ Поиск мест (Geocoding)
Введите в End Point:
```
Rotterdam
```
Появятся подсказки из OpenStreetMap!

### ✅ Map Click
1. Нажмите "Set on Map" для любого поля
2. Кликните на карту
3. Reverse geocoding определит место!

### ✅ Quick DateTime
Попробуйте кнопки:
- Now - текущее время
- +6h, +12h - добавить часы
- +1d, +3d, +7d - добавить дни

### ✅ Swap Locations
Нажмите кнопку ↕️ между полями - они поменяются местами!

### ✅ Calculate Route
Заполните оба поля и нажмите "Calculate Route"
(Расчет маршрута будет в Stage 5)

---

## API Документация

Backend API: http://localhost:8000/docs

Эндпоинты:
- `POST /api/geocode` - поиск мест
- `POST /api/reverse-geocode` - координаты → название
- `GET /api/parse-coordinates` - парсинг координат
- `GET /api/autocomplete` - автокомплит

---

## Troubleshooting

### Port already in use
```bash
# Найти процесс на порту
lsof -i :8000  # или :5173
kill -9 <PID>
```

### Module not found
```bash
cd backend
pip install -r requirements.txt
```

### npm install fails
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🎉 Готово!

Все работает без API ключей благодаря OpenStreetMap! 

**Следующий этап:** Stage 4 - Weather Service

