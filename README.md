# ShipsRadar MVP

Система оптимизации морских маршрутов с учетом погодных условий (ветер, волны, течения) и визуализацией на интерактивной карте.

## 🎯 Описание проекта

ShipsRadar - это веб-приложение для построения оптимальных маршрутов морских судов между двумя точками с учетом:
- Ветра (скорость, направление, порывы)
- Волн (высота, направление, период)
- Океанских течений
- Экстремальных погодных условий
- Прогноза погоды на 7 дней

## 🛠️ Стек технологий

### Frontend
- React 18 + TypeScript
- Leaflet + React-Leaflet - интерактивные карты (без API ключей!)
- Deck.gl - визуализация погодных слоев (Stage 7)
- Tailwind CSS - стилизация
- Vite - сборка

### Backend
- Python 3.11+
- FastAPI - REST API
- Pydantic - валидация данных
- uvicorn - ASGI сервер

### Погодные данные
- Open-Meteo Marine Weather API - ветер, волны, погода
- NOAA RTOFS / Copernicus Marine - течения
- Mapbox Geocoding API - геокодинг

### Геопространственные библиотеки
- GeoPy, Shapely, NumPy, SciPy
- xarray, netCDF4 - обработка океанических данных

## 📋 Требования

- Python 3.11+
- Node.js 18+
- Docker (опционально)

## 🚀 Быстрый старт

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend будет доступен на: http://localhost:8000
API документация: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на: http://localhost:5173

### Docker (весь стек)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

## 📁 Структура проекта

```
shipsradar/
├── backend/                 # FastAPI backend
│   ├── api/                # API endpoints
│   ├── services/           # Бизнес-логика
│   ├── models/             # Pydantic модели
│   ├── main.py             # Точка входа
│   └── requirements.txt    # Python зависимости
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── services/      # API клиенты
│   │   └── types/         # TypeScript типы
│   └── package.json       # Node.js зависимости
├── docker-compose.yml     # Docker конфигурация
├── TZ.md                  # Техническое задание
└── README.md
```

## 🔑 API ключи

**ОТЛИЧНАЯ НОВОСТЬ: НИКАКИЕ API КЛЮЧИ НЕ ТРЕБУЮТСЯ! 🎉**

Проект использует только бесплатные сервисы без регистрации:

1. **Leaflet карты** (Stage 2) - БЕЗ API КЛЮЧЕЙ!
   - Бесплатные OpenStreetMap тайлы
   - Темная тема CartoDB

2. **Nominatim Geocoding** (Stage 3) - БЕЗ API КЛЮЧЕЙ!
   - OpenStreetMap геокодинг
   - Поиск мест, reverse geocoding
   - Полностью бесплатно

3. **Open-Meteo** (Stage 4+) - БЕЗ РЕГИСТРАЦИИ!
   - Бесплатный API погодных данных
   - Unlimited requests

4. **NOAA/Copernicus** (опционально, Stage 4+)
   - Для данных о течениях
   - Может потребовать регистрацию

### Настройка окружения

**НЕ ТРЕБУЕТСЯ!** Все работает из коробки! 🚀

Опционально можно создать `.env` файлы для кастомной конфигурации:

1. Backend `.env` (опционально):
```bash
# Backend environment variables
ENVIRONMENT=development
DEBUG=True
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

2. Frontend `.env` (опционально):
```bash
# Frontend environment variables
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development
```

**Важно:** API ключи НЕ НУЖНЫ! Используются только бесплатные OpenStreetMap сервисы!

## 🎨 UI Референс

Дизайн интерфейса основан на StormGeo:
- Темная тема
- Левая панель с маршрутами
- Интерактивная карта с погодными слоями
- Таблица waypoints внизу
- Топ-бар с метриками погоды

## 📚 Документация API

После запуска backend API документация доступна по адресу:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🧪 Тестирование

### Backend тесты
```bash
cd backend
pytest
```

### Frontend тесты
```bash
cd frontend
npm run test
```

## 🔄 Статус разработки

- ✅ **Этап 1:** Инфраструктура и базовая настройка (завершен)
- ✅ **Этап 2:** Интеграция карты - базовая (завершен)
- ✅ **Этап 3:** Ввод точек A и B (завершен)
- ⏳ **Этап 4:** Weather Service - получение погодных данных (в планах)

См. [TZ.md](./TZ.md) для детального плана реализации.  
См. [STAGE_1_COMPLETE.md](./STAGE_1_COMPLETE.md) для деталей Этапа 1.  
См. [STAGE_2_COMPLETE.md](./STAGE_2_COMPLETE.md) для деталей Этапа 2.  
См. [STAGE_3_COMPLETE.md](./STAGE_3_COMPLETE.md) для деталей Этапа 3.

## 📝 Лицензия

Private project - MVP для демонстрации инвесторам

## 🤝 Команда

В разработке

