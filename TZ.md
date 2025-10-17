# ТЗ: ShipsRadar MVP - Система оптимизации морских маршрутов

## 🎯 Цель продукта
Создать MVP веб-приложения для построения оптимальных маршрутов морских судов с учетом погодных условий (ветер, волны, течения) и визуализацией на интерактивной карте. Продукт для демонстрации инвесторам.

## 🔑 Ключевые требования
- **Модульная архитектура** - каждый компонент легко заменяем
- **Масштабируемость** - возможность улучшения алгоритмов и добавления функций
- **Визуализация** - анимация погоды (ветер, волны, течения)
- **Глобальные маршруты** - вся карта мира
- **Прогноз на 7 дней** - учет изменения погоды во времени

---

## 📊 Стек технологий

### Frontend
- React 18 + TypeScript
- Mapbox GL JS - карты
- Deck.gl - визуализация слоев погоды
- Tailwind CSS - стилизация
- Vite - сборка

### Backend
- Python 3.11+ + FastAPI
- Pydantic - валидация
- uvicorn - сервер

### Погодные данные
- Open-Meteo Marine Weather API - ветер, волны, погода
- NOAA RTOFS / Copernicus Marine - течения
- Mapbox Geocoding API - геокодинг адресов

### Геопространственные библиотеки
- GeoPy - работа с координатами
- Shapely - геометрия
- NumPy/SciPy - вычисления
- xarray, netCDF4 - обработка океанических данных

### Инфраструктура
- Docker + Docker Compose
- PostgreSQL + PostGIS (опционально для v2)

---

## 📋 План реализации

---

## ЭТАП 1: Инфраструктура и базовая настройка

### 1.1 Структура проекта
- [x] Создать корневую структуру папок
- [x] Создать `/backend` папку с Python проектом
- [x] Создать `/frontend` папку с React проектом
- [x] Добавить `.gitignore` для Python и Node.js
- [x] Создать `README.md` с описанием проекта

### 1.2 Backend: Базовая настройка FastAPI
- [x] Инициализировать Python проект с `pyproject.toml` или `requirements.txt`
- [x] Установить FastAPI, uvicorn, pydantic
- [x] Создать базовую структуру:
  - `main.py` - точка входа
  - `api/` - эндпоинты
  - `services/` - бизнес-логика
  - `models/` - Pydantic модели
- [x] Запустить FastAPI сервер на `localhost:8000`
- [x] Проверить автодокументацию `/docs`

### 1.3 Frontend: Базовая настройка React
- [x] Инициализировать React проект с Vite + TypeScript
- [x] Установить базовые зависимости: React, TypeScript
- [x] Настроить Tailwind CSS
- [x] Создать базовую структуру папок:
  - `src/components/` - UI компоненты
  - `src/services/` - API клиенты
  - `src/types/` - TypeScript типы
- [x] Запустить dev сервер на `localhost:5173`
- [x] Проверить базовый рендер страницы

### 1.4 Docker
- [x] Создать `Dockerfile` для backend
- [x] Создать `Dockerfile` для frontend
- [x] Создать `docker-compose.yml` для всего стека
- [x] Проверить запуск через `docker-compose up`

---

## ЭТАП 2: Интеграция карты (базовая)

### 2.1 Установка Mapbox
- [ ] Зарегистрироваться в Mapbox, получить API ключ
- [ ] Установить `mapbox-gl` в frontend
- [ ] Создать компонент `MapView.tsx`
- [ ] Отобразить базовую карту мира
- [ ] Настроить темную тему карты (как StormGeo)

### 2.2 Базовое взаимодействие с картой
- [ ] Добавить контролы (zoom, navigation)
- [ ] Реализовать клик по карте (получение координат)
- [ ] Добавить маркеры на карту (тестовые)
- [ ] Проверить responsive дизайн

---

## ЭТАП 3: Ввод точек A и B

### 3.1 Backend: Geocoding API
- [ ] Создать модели `LocationRequest`, `LocationResponse` в `models/location.py`
- [ ] Реализовать эндпоинт `POST /api/geocode` в `api/location.py`
- [ ] Интегрировать Mapbox Geocoding API
- [ ] Реализовать парсинг координат (разные форматы):
  - Decimal: `35.4437, 139.6380`
  - DMS: `35°26'37"N, 139°38'17"E`
- [ ] Реализовать reverse geocoding (координаты → название)
- [ ] Тестировать API через `/docs`

### 3.2 Frontend: Компонент ввода локаций
- [ ] Создать компонент `LocationInput.tsx`
- [ ] Добавить автокомплит для названий городов/портов
- [ ] Реализовать валидацию ввода координат
- [ ] Добавить кнопку "Set on map" (клик по карте)
- [ ] Создать компонент `RouteInputPanel.tsx`:
  - Поле "Start Point" (A)
  - Поле "End Point" (B)
  - DateTimePicker для времени отправления
  - Кнопка "Calculate Route"

### 3.3 Интеграция с картой
- [ ] При вводе точки A - показать маркер на карте
- [ ] При вводе точки B - показать маркер на карте
- [ ] При клике на карту - заполнить input координатами
- [ ] Проверить UX flow

---

## ЭТАП 4: Weather Service - получение погодных данных

### 4.1 Backend: Open-Meteo интеграция
- [x] Установить `httpx` (async HTTP клиент)
- [x] Создать `services/weather/open_meteo.py`
- [x] Реализовать функцию `fetch_marine_weather()`:
  - Параметры: lat, lon, start_date, end_date
  - Возврат: ветер, волны, температура, осадки, давление
- [x] Создать Pydantic модель `WeatherData`
- [x] Тестировать получение данных для тестовой точки

### 4.2 Backend: NOAA/Copernicus - течения
- [x] Установить `xarray`, `netCDF4`, `siphon`
- [x] Создать `services/weather/ocean_currents.py`
- [x] Реализовать функцию `fetch_currents()`:
  - Подключение к NOAA RTOFS через OPeNDAP
  - Получение u, v компонент течения
  - Интерполяция на нужные координаты
- [x] Создать Pydantic модель `CurrentsData`
- [x] Тестировать получение данных

### 4.3 Backend: Weather Aggregator
- [x] Создать `services/weather/aggregator.py`
- [x] Реализовать функцию `get_weather_for_route()`:
  - Объединяет данные Open-Meteo + NOAA
  - Возвращает единую структуру данных
- [x] Добавить кеширование (in-memory для MVP, потом Redis)
- [x] Создать эндпоинт `GET /api/weather?lat=...&lon=...&date=...`

---

## ЭТАП 5: Route Calculation - простой алгоритм

### 5.1 Backend: Great Circle маршрут
- [x] Установить `geopy`
- [x] Создать `services/route/calculator.py`
- [x] Реализовать класс `SimpleRouteCalculator`:
  - Метод `great_circle_route()` - кратчайший путь
  - Генерация 15-20 waypoints между A и B
- [x] Тестировать расчет базового маршрута

### 5.2 Backend: Избегание экстремальной погоды
- [x] В `SimpleRouteCalculator` добавить метод `avoid_extreme_weather()`:
  - Проверка каждого waypoint на опасные условия
  - Пороги: ветер > 30 узлов, волны > 5 метров
  - Смещение waypoint перпендикулярно маршруту (50-100 nm)
- [x] Реализовать функцию `calculate_weather_penalty()`
- [x] Тестировать корректировку маршрута

### 5.3 Backend: Расчет ETA и метрик
- [x] Добавить метод `calculate_route_metrics()`:
  - ETA для каждого waypoint (скорость судна ~15 узлов)
  - Общая дистанция (nautical miles)
  - Общее время в пути (часы)
- [x] Создать модель `RouteResponse` с waypoints
- [x] Создать эндпоинт `POST /api/route/calculate`

### 5.4 Backend: Интеграция погоды в маршрут
- [x] Для каждого waypoint загрузить прогноз погоды на ETA
- [x] Добавить weather данные в каждый waypoint
- [x] Генерировать warnings (предупреждения):
  - "High waves expected at WP5"
  - "Strong wind at WP12"
- [x] Тестировать полный flow через API

---

## ЭТАП 6: Frontend - отображение маршрута

### 6.1 API клиент для маршрута
- [ ] Создать `services/routeApi.ts`
- [ ] Реализовать функцию `calculateRoute(start, end, departureTime)`
- [ ] Создать TypeScript типы для `Route`, `Waypoint`, `WeatherData`

### 6.2 Отображение маршрута на карте
- [ ] Создать компонент `RouteLayer.tsx`
- [ ] Отрисовать линию маршрута (Mapbox GL JS LineLayer)
- [ ] Отобразить waypoints (точки) на маршруте
- [ ] Добавить popup при клике на waypoint:
  - Координаты
  - ETA
  - Погодные условия
- [ ] Стилизация маршрута (цвет, толщина)

### 6.3 Панель с информацией о маршруте
- [ ] Создать компонент `RouteMetrics.tsx`:
  - Общая дистанция
  - ETA (время прибытия)
  - Время в пути
- [ ] Создать компонент `WeatherWarnings.tsx`:
  - Список предупреждений
  - Иконки опасности
- [ ] Добавить в левую панель (как в StormGeo)

### 6.4 Таблица waypoints
- [ ] Создать компонент `WaypointsTable.tsx`
- [ ] Колонки:
  - #, Coordinates, ETA, Wind, Waves, Currents, Distance
- [ ] Responsive таблица (scroll)
- [ ] Разместить внизу экрана (как в StormGeo)

---

## ЭТАП 7: Визуализация погоды - слои

### 7.1 Backend: API для слоев погоды
- [ ] Создать эндпоинт `GET /api/weather/layer`:
  - Параметры: `type` (wind/waves/currents), `bbox`, `timestamp`
  - Возврат: GeoJSON или grid данных
- [ ] Реализовать генерацию данных для области карты (не только маршрут)
- [ ] Оптимизация: downsample данных для производительности

### 7.2 Frontend: Deck.gl интеграция
- [ ] Установить `deck.gl`, `@deck.gl/react`
- [ ] Создать базовый `DeckGLOverlay` для Mapbox
- [ ] Настроить интеграцию Mapbox + Deck.gl
- [ ] Тестовый слой (например, ScatterplotLayer)

### 7.3 Слой ветра (particle animation)
- [ ] Исследовать библиотеки: `wind-gl` или кастомный WebGL shader
- [ ] Создать `WindLayer.tsx` с Deck.gl
- [ ] Реализовать particle animation (как Windy.com):
  - Частицы движутся по направлению ветра
  - Скорость частиц = скорость ветра
  - Цвет = интенсивность
- [ ] Загрузка данных ветра с backend
- [ ] Оптимизация производительности (WebGL)

### 7.4 Слой волн (heatmap)
- [ ] Создать `WavesLayer.tsx`
- [ ] Использовать Deck.gl HeatmapLayer или GridLayer
- [ ] Цветовая шкала: синий (низкие) → красный (высокие)
- [ ] Загрузка данных волн с backend
- [ ] Легенда высоты волн

### 7.5 Слой течений (vector field)
- [ ] Создать `CurrentsLayer.tsx`
- [ ] Использовать Deck.gl IconLayer или LineLayer для стрелок
- [ ] Стрелки показывают направление и скорость течения
- [ ] Загрузка данных течений с backend
- [ ] Легенда скорости течений

### 7.6 Слои осадков и температуры
- [ ] Создать `PrecipitationLayer.tsx` (опционально для MVP)
- [ ] Создать `TemperatureLayer.tsx` (опционально для MVP)
- [ ] Heatmap визуализация

---

## ЭТАП 8: UI Controls - переключение слоев

### 8.1 Компонент управления слоями
- [ ] Создать компонент `WeatherControls.tsx`
- [ ] Чекбоксы для каждого слоя:
  - ☑ Wind (animated)
  - ☐ Waves (height)
  - ☐ Currents (vectors)
  - ☐ Precipitation
  - ☐ Temperature
- [ ] Возможность включать несколько слоев одновременно
- [ ] Кнопка "Show All" / "Hide All"
- [ ] Слайдеры opacity для каждого слоя

### 8.2 Топ-бар с метриками (как StormGeo)
- [ ] Создать компонент `WeatherTopBar.tsx`
- [ ] Отображение текущих условий:
  - Pressure: XXX hPa
  - Wind: XX.X kts
  - Sig Waves: X.XX m
  - Swell: X.XX m
- [ ] Toggle "Show weather"
- [ ] Дата прогноза

### 8.3 Time Slider - временная шкала
- [ ] Создать компонент `TimeSlider.tsx`
- [ ] Слайдер для выбора даты/времени (от сейчас до +7 дней)
- [ ] При изменении времени - обновление погодных слоев
- [ ] Кнопка Play для анимации изменения погоды
- [ ] Отображение текущего выбранного времени

---

## ЭТАП 9: Левая панель (Routes Panel) - как StormGeo

### 9.1 Список маршрутов
- [ ] Создать компонент `RoutesPanel.tsx`
- [ ] Список сохраненных маршрутов (для MVP - один активный)
- [ ] Информация о маршруте:
  - Название (Start → End)
  - Координаты начала/конца
  - ETD/ETA
  - Дистанция
- [ ] Кнопки:
  - "Create New Route"
  - "Optimize" (placeholder для будущего)

### 9.2 Детали маршрута
- [ ] Секция с параметрами:
  - Sailing time
  - Consumption (опционально для MVP)
  - Distance
- [ ] Toggle "Edit route on map" (опционально для MVP)

### 9.3 Стилизация панели
- [ ] Темная тема (как StormGeo)
- [ ] Collapsible панель (можно скрыть)
- [ ] Responsive для мобильных (drawer)

---

## ЭТАП 10: Полировка UI/UX

### 10.1 Общий дизайн
- [ ] Применить темную тему ко всем компонентам
- [ ] Единая цветовая палитра (синие, серые тона)
- [ ] Консистентные шрифты и размеры
- [ ] Иконки (react-icons или heroicons)

### 10.2 Loading states
- [ ] Добавить спиннеры при загрузке маршрута
- [ ] Скелетоны для таблицы waypoints
- [ ] Progress bar для загрузки погодных данных

### 10.3 Error handling
- [ ] Toast уведомления для ошибок
- [ ] Fallback UI если API недоступен
- [ ] Валидация форм с понятными сообщениями

### 10.4 Анимации
- [ ] Плавные переходы между состояниями
- [ ] Анимация появления маршрута на карте
- [ ] Smooth zoom к маршруту после расчета

---

## ЭТАП 11: Оптимизация и production-ready

### 11.1 Backend оптимизация
- [ ] Добавить логирование (loguru)
- [ ] Обработка ошибок (try/except, HTTP exceptions)
- [ ] Rate limiting для API (slowapi)
- [ ] CORS настройка для frontend
- [ ] Environment variables (.env файл)

### 11.2 Frontend оптимизация
- [ ] Code splitting (React.lazy)
- [ ] Мемоизация компонентов (React.memo)
- [ ] Оптимизация ре-рендеров
- [ ] Debounce для поиска локаций
- [ ] Lazy loading погодных слоев

### 11.3 Кеширование
- [ ] Backend: кеш прогнозов (in-memory или Redis)
- [ ] Frontend: React Query для кеширования API запросов
- [ ] Service Worker для offline (опционально)

### 11.4 Environment setup
- [ ] `.env.example` файлы для backend и frontend
- [ ] Инструкции по получению API ключей:
  - Mapbox
  - Open-Meteo (не требуется)
  - NOAA/Copernicus (если нужна регистрация)

---

## ЭТАП 12: Тестирование и документация

### 12.1 Тестирование backend
- [ ] Тесты для route calculator (pytest)
- [ ] Тесты для weather API интеграции
- [ ] Тесты для geocoding
- [ ] Минимум 60% coverage

### 12.2 Тестирование frontend
- [ ] Unit тесты для утилит (vitest)
- [ ] Component тесты (React Testing Library) - опционально
- [ ] E2E тесты (Playwright) - опционально для MVP

### 12.3 Документация
- [ ] README.md с:
  - Описание проекта
  - Скриншоты
  - Инструкции по запуску
  - Стек технологий
- [ ] API документация (автогенерация FastAPI)
- [ ] Архитектурная диаграмма

---

## ЭТАП 13: Деплой (опционально для локальной демо)

### 13.1 Docker production build
- [ ] Оптимизированные Dockerfile (multi-stage)
- [ ] docker-compose для production
- [ ] Nginx для reverse proxy

### 13.2 Cloud деплой (если нужно для инвесторов)
- [ ] Frontend → Vercel или Netlify
- [ ] Backend → Railway, Render или AWS
- [ ] Environment variables в cloud
- [ ] Custom domain (опционально)

---

## 📊 Архитектура модулей (для справки)

```
shipsradar/
├── backend/
│   ├── main.py                    # FastAPI app
│   ├── api/
│   │   ├── location.py           # Geocoding endpoints
│   │   ├── route.py              # Route calculation
│   │   └── weather.py            # Weather data
│   ├── services/
│   │   ├── route/
│   │   │   ├── calculator.py     # SimpleRouteCalculator (MVP)
│   │   │   └── interface.py      # Abstract class для будущего
│   │   └── weather/
│   │       ├── open_meteo.py     # Wind, waves, weather
│   │       ├── ocean_currents.py # NOAA/Copernicus
│   │       └── aggregator.py     # Unified weather data
│   ├── models/
│   │   ├── location.py           # Pydantic models
│   │   ├── route.py
│   │   └── weather.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   │   ├── MapView.tsx
│   │   │   │   ├── RouteLayer.tsx
│   │   │   │   └── WeatherLayers/
│   │   │   │       ├── WindLayer.tsx
│   │   │   │       ├── WavesLayer.tsx
│   │   │   │       └── CurrentsLayer.tsx
│   │   │   ├── RouteInput/
│   │   │   │   ├── LocationInput.tsx
│   │   │   │   └── DateTimePicker.tsx
│   │   │   ├── RoutePanel/
│   │   │   │   ├── RoutesPanel.tsx
│   │   │   │   ├── RouteMetrics.tsx
│   │   │   │   └── WeatherWarnings.tsx
│   │   │   ├── WaypointsTable.tsx
│   │   │   ├── WeatherControls.tsx
│   │   │   ├── WeatherTopBar.tsx
│   │   │   └── TimeSlider.tsx
│   │   ├── services/
│   │   │   ├── routeApi.ts
│   │   │   ├── weatherApi.ts
│   │   │   └── geocodingApi.ts
│   │   └── types/
│   │       └── index.ts
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🎯 Критерии успеха MVP

- ✅ Пользователь может ввести точки A и B (название или координаты)
- ✅ Система строит маршрут с 15-20 waypoints
- ✅ Маршрут учитывает экстремальную погоду (избегает штормы)
- ✅ Прогноз погоды на 7 дней для каждого waypoint
- ✅ Визуализация 3 основных слоев: ветер (анимация), волны, течения
- ✅ Таблица с детальной информацией по waypoints
- ✅ ETA и метрики маршрута
- ✅ UI похож на StormGeo (темная тема, профессионально)
- ✅ Модульная архитектура - можно заменить алгоритм маршрутизации
- ✅ Работает локально через Docker

---

## 🚀 Будущие улучшения (v2.0+)

- Продвинутый алгоритм A* для оптимизации маршрута
- Учет расхода топлива
- Множественные типы судов
- Редактирование маршрута на карте (drag waypoints)
- Сохранение маршрутов в БД
- AIS интеграция (реальные суда)
- Экспорт маршрута в форматы (GPX, KML)
- Уведомления о изменении погоды
- ML модель для предсказания оптимальных маршрутов

---

## ⏱️ Оценка времени разработки

- **Этапы 1-3:** 2-3 дня (инфраструктура, карта, ввод точек)
- **Этапы 4-6:** 3-4 дня (погодные данные, расчет маршрута, отображение)
- **Этапы 7-8:** 4-5 дней (визуализация слоев, controls)
- **Этапы 9-10:** 2-3 дня (UI panels, полировка)
- **Этапы 11-13:** 2-3 дня (оптимизация, тесты, деплой)

**Итого: 13-18 дней разработки** (1 разработчик full-time)

Для команды из 2 человек (frontend + backend параллельно): **~10-12 дней**

