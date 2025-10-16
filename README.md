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
- Mapbox GL JS - интерактивные карты
- Deck.gl - визуализация погодных слоев
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

Для работы приложения необходимы следующие API ключи:

1. **Mapbox Access Token** (обязательно)
   - Регистрация: https://account.mapbox.com/
   - Бесплатно: 50,000 загрузок карты/месяц

2. **Open-Meteo** (не требуется регистрация)
   - Бесплатный API без ограничений

3. **NOAA/Copernicus** (опционально, требуется регистрация)
   - Для данных о течениях

### Настройка окружения

1. Создайте `.env` файл в корне `backend/`:
```bash
# Backend environment variables
MAPBOX_API_KEY=your_mapbox_token_here
ENVIRONMENT=development
```

2. Создайте `.env` файл в корне `frontend/`:
```bash
# Frontend environment variables
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_API_BASE_URL=http://localhost:8000
```

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

MVP в разработке. См. [TZ.md](./TZ.md) для детального плана реализации.

## 📝 Лицензия

Private project - MVP для демонстрации инвесторам

## 🤝 Команда

В разработке

