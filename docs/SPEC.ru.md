# Vitrin — ТЗ и план разработки

> **Vitrin** (`vitrin.work`) — сервис, который за пару минут собирает из ссылок на работы фрилансера красивую страницу-портфолио `vitrin.work/{username}`. Каждая работа — «окно»: его можно раскрыть и пролистать/прокликать сайт, прототип Figma, видео, репозиторий — прямо на странице.
>
> Документ предназначен для Claude Code. Работай **строго по этапам** (раздел 14). В начале проекта создай `CLAUDE.md` с этим ТЗ, стека и соглашений, и обновляй его по ходу.

---

## 0. Ключевые решения (зафиксировано)

| Вопрос | Решение |
|---|---|
| Рынок | Весь мир |
| Целевая аудитория | 1) разработчики, 2) дизайнеры, 3) видеомонтажёры / моушн / фото, далее — все фрилансеры |
| Модель | Freemium: Free + Pro (€8/мес или €72/год) |
| Оплата | Paddle Billing (Merchant of Record) |
| Языки интерфейса | EN (по умолчанию), ES, PT-BR, RU, RO, DE, FR, TR, UK, PL |
| Темы | Светлая (белый фон) и тёмная (чёрный фон) + «как в системе» |
| Акцентный цвет платформы | Оранжевый `#FF6B00` |
| Pro-фича | Свой акцентный цвет страницы из палитры |
| Модерация | Автофильтры + кнопка «Пожаловаться» + ручная проверка в админке |
| Связь с фрилансером | Внешние кнопки контактов + встроенная форма заявки (на почту + «Входящие» в кабинете) |
| Хостинг | Vercel + Supabase |

---

## 1. Стек

- **Фреймворк:** Next.js (App Router, последняя стабильная), TypeScript strict, React Server Components по умолчанию.
- **UI:** Tailwind CSS + shadcn/ui, иконки `lucide-react`, анимации `framer-motion` (умеренно).
- **Drag-and-drop:** `@dnd-kit`.
- **БД / Auth / Storage:** Supabase (Postgres, Supabase Auth, Supabase Storage). Доступ через `@supabase/ssr`. Row Level Security включён на всех таблицах.
- **Валидация:** Zod (общие схемы для форм и API).
- **Формы:** `react-hook-form` + Zod resolver.
- **i18n:** `next-intl`.
- **Метаданные + скриншоты:** внешний сервис через интерфейс `ScreenshotProvider` (реализация по умолчанию — Microlink API; должна легко заменяться на ScreenshotOne или свой Playwright-воркер).
- **Email:** Resend + React Email шаблоны.
- **Оплата:** Paddle Billing (Paddle.js overlay checkout + webhooks).
- **Rate limit:** Upstash Redis + `@upstash/ratelimit`.
- **Капча:** Cloudflare Turnstile.
- **Проверка ссылок:** Google Web Risk API (или Safe Browsing Lookup API).
- **Модерация текста/изображений:** OpenAI Moderation API (`omni-moderation-latest`).
- **Фоновые задачи:** Vercel Cron + Route Handlers; тяжёлые операции — асинхронно через таблицу-очередь `jobs` (см. 5.3).
- **Тесты:** Vitest (юнит), Playwright (e2e ключевых сценариев).
- **Линт/формат:** ESLint + Prettier.

> Все внешние сервисы — за собственными интерфейсами в `src/lib/services/*`, чтобы их можно было заменить без переписывания бизнес-логики.

---

## 2. Структура проекта

```
src/
  app/
    [locale]/                 # маркетинговые и публичные страницы с префиксом языка
      page.tsx                # лендинг
      catalog/                # каталог фрилансеров (этап 2)
      pricing/
      terms/ privacy/ refund/ # юридические страницы (обязательны для Paddle)
      login/ signup/
    dashboard/                # кабинет (язык из cookie/профиля, без префикса)
      page.tsx                # обзор
      works/ profile/ inbox/ stats/ settings/ billing/
    onboarding/
    admin/                    # модерация (только role=admin)
    [username]/               # публичная страница портфолио
      page.tsx
      w/[workSlug]/page.tsx   # прямая ссылка на работу (открывает viewer)
    api/
      works/ ingest/ hire/ events/ report/
      webhooks/paddle/
      cron/recheck-links/ cron/refresh-screenshots/ cron/process-jobs/
  components/
    portfolio/ (ProfileHeader, WorkGrid, WorkCard, WorkViewer, DeviceSwitcher, HireForm)
    viewer-adapters/ (LiveIframe, FigmaEmbed, VideoEmbed, GithubCard, ScreenshotScroller, PdfViewer, ImageGallery, TelegramPost, GoogleDocEmbed)
    dashboard/ ui/
  lib/
    ingest/        # определение типа ссылки, парсинг, проверки
    services/      # screenshot, moderation, webrisk, email, paddle, ratelimit
    plans.ts       # лимиты тарифов (единый источник правды)
    specializations.ts
    reserved-usernames.ts
    supabase/
  i18n/ messages/{en,es,pt-BR,ru,ro,de,fr,tr,uk,pl}.json
supabase/migrations/
```

---

## 3. Маршруты и правила URL

- Публичный профиль: `vitrin.work/{username}` — **без** языкового префикса. Язык интерфейса (кнопки, подписи) — по `Accept-Language` посетителя / cookie, контент — как написал фрилансер.
- Прямая ссылка на работу: `vitrin.work/{username}/w/{workSlug}` — открывает страницу профиля с раскрытым viewer'ом этой работы (для шаринга и SEO).
- Маркетинг/каталог: `vitrin.work/{locale}/...`, `vitrin.work/` редиректит на язык по `Accept-Language` (по умолчанию `en`).
- **Username:** 3–30 символов, `a-z 0-9 - _`, начинается с буквы, регистр не важен (хранить в нижнем регистре, `citext`).
- **Зарезервированные username** (`src/lib/reserved-usernames.ts`): все коды языков (`en, es, pt-br, ru, ro, de, fr, tr, uk, pl` и прочие ISO 639-1), все служебные маршруты (`dashboard, admin, api, login, signup, onboarding, catalog, pricing, terms, privacy, refund, w, settings, help, support, blog, about, static, assets, _next`), бренд (`vitrin`), а также стоп-лист нецензурных слов и известных брендов.
- Смена username разрешена 1 раз в 30 дней; старый username 30 дней редиректит на новый.

---

## 4. Модель данных (Postgres / Supabase)

Все таблицы: `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at` (триггер). RLS включён везде.

### `profiles`
| Поле | Тип | Примечание |
|---|---|---|
| id | uuid pk | = `auth.users.id` |
| username | citext unique | см. правила выше |
| display_name | text | |
| headline | text ≤ 80 | «Frontend-разработчик, React/Next.js» |
| bio | text ≤ 600 | |
| avatar_url | text | Supabase Storage |
| specialization | text | ключ из `specializations.ts` |
| skills | text[] ≤ 20 | нормализованные теги |
| work_languages | text[] | языки, на которых работает |
| country | char(2) | ISO |
| rate_min, rate_max | int | необязательно |
| rate_currency | char(3) | default `USD` |
| rate_unit | enum `hour|project` | |
| available_for_work | bool | бейдж «Открыт к работе» |
| contacts | jsonb | `{telegram, whatsapp, email, linkedin, github, behance, dribbble, instagram, x, website}` |
| theme | enum `light|dark|system` | default `system` |
| accent_color | text | hex из палитры, только Pro; иначе `#FF6B00` |
| ui_locale | text | язык кабинета |
| plan | enum `free|pro` | вычисляется из подписки, кэшируется здесь |
| role | enum `user|admin` | |
| status | enum `active|hidden|banned` | |
| email_verified | bool | |
| catalog_visible | bool (generated/вычисляемое) | см. 8.2 |
| username_changed_at | timestamptz | |
| onboarding_completed | bool | |

### `works`
| Поле | Тип | Примечание |
|---|---|---|
| profile_id | uuid fk | |
| slug | text | уникален в рамках профиля |
| position | int | порядок в сетке |
| source_url | text | исходная ссылка (null для загруженных файлов) |
| source_type | enum | `website, figma, github, youtube, vimeo, loom, google_doc, google_slides, notion, telegram_post, behance, dribbble, upload_image, upload_video, upload_pdf, other` |
| render_mode | enum | `live_iframe, embed, github_card, screenshot, video, pdf, gallery` |
| embed_url | text | готовый URL для iframe/embed |
| title | text ≤ 100 | |
| description | text ≤ 1000 | задача / что сделал |
| result | text ≤ 200 | «+40% конверсии», «200k просмотров» |
| category | text | ключ категории |
| tags | text[] ≤ 10 | |
| cover_url | text | обложка карточки (свой upload > OG image > скриншот) |
| cover_source | enum `custom|og|screenshot` | |
| screenshot_url | text | полностраничный скриншот (для screenshot-режима) |
| meta | jsonb | сырые данные: OG, GitHub stats, длительность видео и т.п. |
| iframe_allowed | bool | результат проверки заголовков |
| ingest_status | enum `pending|processing|ready|failed` | |
| safety_status | enum `pending|safe|unsafe` | Web Risk |
| moderation_status | enum `pending|approved|flagged|rejected` | |
| is_broken | bool | ссылка перестала открываться |
| last_checked_at | timestamptz | |
| is_hidden | bool | скрыта самим пользователем |

### `work_files`
`work_id, storage_path, mime, size_bytes, kind (image|video|pdf), position` — для галерей и загрузок.

### `hire_requests`
`profile_id, work_id (nullable), name, email, budget (text), message ≤ 2000, locale, status (new|read|archived|spam), ip_hash`.

### `events` (аналитика, без cookies)
`bigserial id, profile_id, work_id (nullable), type (profile_view|work_expand|work_open_external|hire_click|hire_submit|contact_click), contact_type, visitor_hash, referrer_host, country, device (desktop|tablet|mobile), created_at`.
- `visitor_hash = sha256(ip + user_agent + дневная соль)` — соль ротируется ежедневно, IP не хранится (GDPR-friendly).
- Индексы по `(profile_id, created_at)`, `(work_id, created_at)`.
- Не логировать просмотры владельца своей страницы.

### `subscriptions`
`profile_id, paddle_subscription_id unique, paddle_customer_id, price_id, interval (month|year), status (trialing|active|past_due|paused|canceled), current_period_end, canceled_at, raw jsonb`.

### `reports`
`target_type (profile|work), target_id, reason (spam|nsfw|scam|copyright|offensive|other), details, reporter_email (nullable), reporter_hash, status (open|resolved|dismissed), resolved_by, resolution_note`.

### `jobs` (очередь фоновых задач)
`type (ingest_work|recheck_link|refresh_screenshot|moderate), payload jsonb, status (queued|running|done|failed), attempts, run_after, last_error`.

### `moderation_log`
`actor_id, target_type, target_id, action, note`.

### RLS (суть)
- `profiles`: читать публичные поля может любой, если `status='active'`; изменять — только владелец (кроме `plan, role, status` — только service role / admin).
- `works`: читать любой, если профиль активен, работа не скрыта, `safety_status='safe'` и `moderation_status in ('approved','pending')`; CRUD — владелец.
- `hire_requests`: вставка — только через API route (service role, после капчи и rate limit); чтение — владелец профиля.
- `events`: вставка — только через API route; чтение агрегатов — владелец.
- `subscriptions`, `jobs`, `moderation_log`: только service role; `reports` — вставка через API, чтение admin.

---

## 5. Функционал по модулям

### 5.1 Авторизация
- **Этап 1:** Google OAuth, email + пароль, magic link по email. Вход по username + пароль (найти email по username на сервере, не раскрывая его клиенту).
- **Этап 2:** Facebook OAuth, Telegram Login Widget (кастомная интеграция: проверка подписи `hash` по bot token на сервере → создание/связка пользователя в Supabase через admin API).
- **Этап 3:** Apple (требует Apple Developer аккаунт).
- Подтверждение email обязательно для попадания в каталог и получения заявок через форму.
- Cloudflare Turnstile на регистрации, входе по паролю и сбросе пароля.

### 5.2 Онбординг (цель — страница готова за 2 минуты)
1. Выбор username с проверкой доступности в реальном времени (debounce 300 мс) и превью `vitrin.work/username`.
2. Имя, специализация (выпадающий список), headline, аватар (из OAuth по умолчанию).
3. **Вставка ссылок пачкой:** textarea «вставьте 1–10 ссылок, каждая с новой строки» + кнопка загрузки файлов. Все ссылки сразу создают работы со статусом `pending` и уходят в ingest-пайплайн; пользователь видит карточки со скелетонами, которые наполняются по мере готовности.
4. Контакты (минимум один) — Telegram / email / WhatsApp / LinkedIn.
5. Экран «Ваша страница готова» + кнопки «Открыть», «Скопировать ссылку», «Поделиться».

### 5.3 Ingest-пайплайн ссылки (сердце продукта)
Запускается при добавлении ссылки; выполняется асинхронно через `jobs` (обработчик — `/api/cron/process-jobs`, вызывается Vercel Cron каждую минуту **и** сразу после создания работы fire-and-forget запросом). Клиент следит за статусом через Supabase Realtime (подписка на изменения `works`).

Шаги:
1. **Нормализация URL:** обязательный `https`, убрать трекинг-параметры (`utm_*`, `fbclid`, `gclid`), раскрыть редиректы.
2. **Проверка безопасности:** Google Web Risk. `unsafe` → работа отклоняется, пользователю показывается ошибка «Ссылка помечена как небезопасная».
3. **Определение `source_type`** по хосту и пути (таблица ниже).
4. **Сбор метаданных:** OG/Twitter meta (title, description, image, favicon, site name) через `ScreenshotProvider`/свой fetch; для GitHub — GitHub REST API; для YouTube/Vimeo/Loom — oEmbed.
5. **Проверка встраиваемости** (для `website`, `notion`, `other`): серверный GET, анализ заголовков:
   - `X-Frame-Options: DENY | SAMEORIGIN` → `iframe_allowed=false`;
   - `Content-Security-Policy: frame-ancestors ...` без `*` и без `https://vitrin.work` → `false`;
   - иначе `true`.
6. **Скриншоты:** обложка 1280×800 (viewport) + полностраничный скриншот (ширина 1440, ограничение высоты ~15000px) → сохранить в Supabase Storage (не хотлинкать сторонние URL).
7. **Выбор `render_mode`** (таблица ниже) и формирование `embed_url`.
8. **Модерация текста** (title/description из метаданных) через OpenAI Moderation; при срабатывании `moderation_status='flagged'` (работа видна только владельцу до проверки).
9. `ingest_status='ready'`. При ошибке — до 3 повторов с экспоненциальной задержкой, затем `failed` с понятным сообщением и кнопкой «Повторить».

Пользователь всегда может вручную поправить название, описание, обложку и режим показа (например, принудительно «скриншот» вместо живого сайта).

#### Таблица адаптеров
| source_type | Определение | render_mode | Как показывать | Этап |
|---|---|---|---|---|
| website | любой http(s), не попавший в правила ниже | `live_iframe` если `iframe_allowed`, иначе `screenshot` | живой сайт / скроллящийся скриншот + кнопка «Открыть сайт» | 1 |
| figma | `figma.com/(file|design|proto|board)/...` | `embed` | официальный Figma embed (проверить актуальный формат URL в документации Figma); прототипы кликабельны | 1 |
| github | `github.com/{owner}/{repo}` | `github_card` | своя карточка: название, описание, язык(и), звёзды, форки, дата обновления, topics, отрендеренный README (sanitize!), ссылка на live demo из `homepage` | 1 |
| youtube | `youtube.com/watch`, `youtu.be`, `/shorts/` | `video` | `youtube-nocookie.com/embed/{id}` | 1 |
| vimeo | `vimeo.com/{id}` | `video` | `player.vimeo.com/video/{id}` | 1 |
| loom | `loom.com/share/{id}` | `video` | `loom.com/embed/{id}` | 1 |
| google_doc / google_slides | `docs.google.com/document|presentation/...` | `embed` | `/preview` или `/embed`; если документ не публичный — ошибка с инструкцией «откройте доступ по ссылке» | 1 |
| upload_image | загрузка | `gallery` | галерея со свайпом и зумом | 1 |
| notion | `notion.site`, `notion.so` | как website | iframe если разрешён, иначе скриншот | 2 |
| telegram_post | `t.me/{channel}/{id}` | `embed` | Telegram Post Widget | 2 |
| behance / dribbble | хосты | `screenshot` / `gallery` | обложка из OG + полностраничный скриншот | 2 |
| upload_video | загрузка (mp4/webm) | `video` | нативный `<video>` с постером | 2 |
| upload_pdf | загрузка | `pdf` | встроенный просмотрщик (pdf.js / нативный), листание | 2 |

### 5.4 Публичная страница портфолио `/{username}`
**Шапка:**
- Аватар, имя, бейдж Pro (незаметный), headline, специализация, страна, языки работы.
- Бейдж «Открыт к работе» (зелёная точка), ставка (если указана).
- Био (сворачивается после 3 строк).
- Навыки — чипы.
- Кнопки: **«Нанять меня»** (primary, акцентный цвет, открывает форму), иконки контактов, «Поделиться» (Web Share API / копирование ссылки).

**Фильтр:** чипы категорий/тегов над сеткой (только если у работ ≥2 разных категорий).

**Сетка работ:** 4 колонки ≥1280px, 3 — ≥1024px, 2 — ≥640px, 1 — <640px (на мобилке допустимо 2 колонки с компактными карточками — проверить визуально, выбрать лучшее). Карточки с соотношением 4:3, скругление, лёгкая тень.

**Карточка работы:**
- Обложка, название, маленькая иконка типа (сайт/Figma/GitHub/видео...), строка результата (если есть).
- **Hover (десктоп):** затемнение обложки; снизу по центру кнопка «Перейти» (открывает `source_url` в новой вкладке, `rel="noopener noreferrer"`); в правом нижнем углу иконка «Развернуть» (открывает viewer). Клик по самой карточке = «Развернуть».
- **Тач-устройства:** hover нет → кнопки видны всегда в компактном виде; тап по карточке = «Развернуть».
- Бейдж режима в углу: `Live` (интерактив) или `Preview` (скриншот).

**Footer:** «Made with Vitrin — создай своё портфолио» (Free) / отсутствует (Pro). Кнопка «Пожаловаться» — мелко в футере.

### 5.5 Viewer (раскрытое окно)
- Модальное окно почти на весь экран (отступы 24px на десктопе), на мобилке — полноэкранное.
- Меняет URL на `/{username}/w/{slug}` (shallow routing), закрытие возвращает URL профиля; Esc / клик по фону / кнопка ✕ закрывают.
- **Верхняя панель:** название, иконка типа, **DeviceSwitcher** (Desktop 1440 / Tablet 768 / Mobile 390 — только для `live_iframe` и `screenshot`), кнопка «Открыть оригинал», «Поделиться», ✕.
- **Контент:** адаптер по `render_mode`.
  - `live_iframe`: iframe рендерится с реальной шириной выбранного устройства и масштабируется `transform: scale()` под доступное пространство (чтобы сайт отображался как на настоящем экране). Атрибуты: `sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"`, `referrerpolicy="no-referrer"`, `loading="lazy"`. Показывать лоадер; если за 10 с не загрузился — предложить скриншот-режим.
  - `screenshot`: вертикально скроллящийся полностраничный скриншот в «рамке устройства».
  - `embed`, `video`, `pdf`, `gallery`, `github_card` — соответствующие компоненты.
- **Боковая/нижняя панель** (сворачиваемая): описание, результат, теги, кнопка «Нанять меня — обсудить похожий проект» (форма предзаполняется ссылкой на работу).
- Стрелки ← → (и свайп на мобилке) — переход к соседним работам.
- Считать событие `work_expand`.

### 5.6 Форма «Нанять меня»
- Поля: имя*, email*, бюджет (свободный текст или выбор диапазона), описание задачи* (≤2000), работа, из которой пришли (скрытое, если открыто из viewer).
- Защита: Turnstile, rate limit (3 заявки / час / IP-хэш, 20 / сутки на профиль от одного отправителя), модерация текста, honeypot-поле.
- После отправки: письмо фрилансеру (Resend; кнопка «Ответить» = reply-to на email клиента) + запись в `hire_requests` + событие `hire_submit`. Клиенту — экран «Отправлено» (без раскрытия email фрилансера).
- Требует подтверждённый email фрилансера; иначе форма заменяется только кнопками контактов.

### 5.7 Кабинет `/dashboard`
- **Обзор:** ссылка на страницу (копировать), счётчики за 7/30 дней (просмотры, раскрытия, заявки), последние заявки, чек-лист заполнения профиля (аватар, био, ≥3 работы, контакты, подтверждённый email).
- **Работы:** список/сетка с drag-and-drop сортировкой, добавление ссылкой или пачкой ссылок или файлом, статусы ingest, редактирование (название, описание, результат, категория, теги, своя обложка, режим показа), скрыть/удалить, «Обновить скриншот», индикатор лимита тарифа («8 из 12»).
- **Профиль:** все поля профиля, username (с правилом раз в 30 дней), контакты, живое превью.
- **Входящие:** заявки (новые/прочитанные/архив/спам), пометка прочитанной, ответ через mailto.
- **Статистика:** Free — общее число просмотров профиля; Pro — графики по дням, по каждой работе (раскрытия, переходы), источники трафика (referrer), страны, устройства, клики по контактам, заявки по работам.
- **Настройки:** тема (light/dark/system), акцентный цвет (Pro), язык кабинета, email-уведомления (новая заявка, битая ссылка, еженедельный отчёт — этап 2), привязанные способы входа, удаление аккаунта (полное удаление данных и файлов, GDPR), экспорт данных (JSON).
- **Подписка:** текущий план, кнопка апгрейда (Paddle checkout), управление/отмена (Paddle customer portal), история платежей.

### 5.8 Каталог `/[locale]/catalog` (этап 2)
- Поиск по username, имени, headline, навыкам (Postgres full-text + `pg_trgm` для опечаток).
- Фильтры: специализация, навыки, языки работы, страна, «Открыт к работе», диапазон ставки.
- Сортировка: релевантность (Pro выше при прочих равных), новые, популярные (просмотры за 30 дней).
- Карточка фрилансера: аватар, имя, headline, 3 мини-обложки работ, бейджи, ставка.
- Попадают только `catalog_visible` профили (см. 8.2).
- SEO-страницы вида `/[locale]/catalog/{specialization}` (например `/en/catalog/web-developer`).

### 5.9 Специализации и категории (`src/lib/specializations.ts`, ключи + переводы)
`web-developer, frontend-developer, backend-developer, fullstack-developer, mobile-developer, game-developer, qa-engineer, devops, data-analyst, ui-ux-designer, web-designer, graphic-designer, brand-designer, 3d-artist, illustrator, video-editor, motion-designer, photographer, copywriter, content-writer, translator, smm-manager, performance-marketer, seo-specialist, other`.
Категории работ: `website, web-app, mobile-app, landing, design-mockup, prototype, branding, illustration, video, motion, photo, article, social-post, code-repository, presentation, other`.

---

## 6. Тарифы и лимиты

Единый источник правды — `src/lib/plans.ts`; все проверки лимитов — на сервере (в API routes / server actions), UI только отображает.

| Возможность | Free | Pro (€8/мес · €72/год) |
|---|---|---|
| Работ в портфолио | до 12 | без лимита (технический потолок 200) |
| Загрузка файлов | всего 100 МБ, изображения; ≤10 МБ на файл | 5 ГБ, изображения + видео (≤500 МБ на файл) + PDF |
| Брендинг «Made with Vitrin» | есть | убран |
| Статистика | общее число просмотров | полная аналитика (5.7) |
| Каталог | обычная позиция | выше в выдаче + бейдж Pro |
| Тема light/dark/system | ✅ | ✅ |
| Свой акцентный цвет | — (всегда `#FF6B00`) | ✅ палитра из 12 цветов |
| Частота проверки ссылок | раз в неделю | раз в сутки |
| Кастомный домен | — | этап 3 |
| Экспорт портфолио в PDF | — | этап 3 |

**Палитра акцентов (Pro):** `#FF6B00` (по умолчанию), `#FF3B30`, `#FF2D78`, `#AF52DE`, `#7C3AED`, `#2F5BFF`, `#0A84FF`, `#00B8D9`, `#00C853`, `#C6F432`, `#FFC400`, `#8E8E93`. Для каждого цвета заранее проверить контраст текста на кнопке (белый или чёрный текст, WCAG AA) в обеих темах.

**Даунгрейд Pro → Free:** данные не удаляются; работы сверх 12 скрываются с публичной страницы (владелец выбирает, какие 12 оставить), акцент сбрасывается на оранжевый, брендинг возвращается. При повторной подписке всё восстанавливается.

---

## 7. Оплата — Paddle Billing

- Два price в Paddle: `pro_monthly` (€8), `pro_yearly` (€72). ID — в env.
- Checkout: Paddle.js overlay, в `customData` передавать `profile_id`.
- Webhook `/api/webhooks/paddle`: проверка подписи (`Paddle-Signature`), идемпотентность по `event_id`. Обрабатывать `subscription.created`, `subscription.updated`, `subscription.canceled`, `subscription.past_due`, `transaction.completed`. Обновлять `subscriptions` и кэш `profiles.plan`.
- `plan='pro'` при статусе `active`, `trialing` или `past_due` (грейс-период), а также при `canceled`, пока не наступил `current_period_end`.
- Управление подпиской — Paddle customer portal.
- Цены показывать с пометкой, что налоги рассчитываются при оплате (Paddle как MoR).
- Обязательные страницы для одобрения аккаунта Paddle: **Terms of Service, Privacy Policy, Refund Policy**, цены на сайте, контактный email. Сделать их в этапе 1 (шаблонные тексты, переведённые хотя бы на EN).
- Sandbox Paddle для разработки, переключение через env.

---

## 8. Модерация и безопасность контента

### 8.1 Автоматические проверки
| Что | Чем | Действие |
|---|---|---|
| Каждая ссылка (при добавлении и при перепроверке) | Google Web Risk | `unsafe` → отклонить / скрыть работу, уведомить владельца |
| Username | стоп-лист + зарезервированные | запрет при регистрации |
| Имя, headline, bio, описания работ | OpenAI Moderation | `flagged` → скрыть публично до ручной проверки |
| Загруженные изображения и аватары | OpenAI Moderation (image input) | `flagged` → скрыть до ручной проверки |
| Заявки через форму | Turnstile + rate limit + honeypot + Moderation | блок / пометка `spam` |
| Регистрация, вход, сброс пароля | Turnstile + rate limit | блок |

### 8.2 Видимость в каталоге
Профиль попадает в каталог, только если: email подтверждён, `status='active'`, ≥3 готовых работ с `safety_status='safe'` и не `flagged`, заполнены аватар и headline. Публичная страница по прямой ссылке доступна сразу после онбординга.

### 8.3 Жалобы и админка `/admin`
- Кнопка «Пожаловаться» на профиле и в viewer'е: причина + комментарий + Turnstile.
- 3+ открытые жалобы от разных посетителей на один объект → автоскрытие до проверки.
- Админка: очередь `flagged`-контента и жалоб, просмотр объекта, действия (одобрить / скрыть / удалить работу / забанить профиль / отклонить жалобу), всё пишется в `moderation_log`. Письмо владельцу при скрытии/бане.

### 8.4 Техническая безопасность
- Просмотр чужих сайтов только в `iframe` с `sandbox` (5.5). Пользовательский HTML **не** принимается и не хостится.
- Загруженные файлы отдаются из Supabase Storage (отдельный домен), проверка MIME по содержимому (magic bytes), а не по расширению; SVG не принимать.
- README из GitHub и любой внешний HTML — только через санитайзер (`rehype-sanitize` / DOMPurify).
- CSP для самого приложения: `frame-src` разрешает `https:`, `script-src` — только свои + Paddle + Turnstile + Telegram widget.
- SSRF-защита в ingest: не ходить на приватные IP (127.0.0.0/8, 10/8, 172.16/12, 192.168/16, 169.254/16, ::1, fc00::/7), только порты 80/443, таймаут 10 с, лимит размера ответа.
- Все мутации — через server actions / API с проверкой сессии и владельца; лимиты тарифа — на сервере.

---

## 9. Фоновые задачи (Vercel Cron)
| Задача | Частота | Что делает |
|---|---|---|
| `process-jobs` | каждую минуту | берёт из `jobs` до N задач (`FOR UPDATE SKIP LOCKED`), выполняет |
| `recheck-links` | ежедневно | ставит в очередь перепроверку: Pro — каждые сутки, Free — раз в неделю. Проверяет доступность (HTTP 2xx/3xx), Web Risk, заново iframe-заголовки. Битая ссылка → `is_broken=true` + письмо владельцу |
| `refresh-screenshots` | еженедельно | обновляет скриншоты `website`-работ старше 30 дней |
| `rotate-salt` | ежедневно | новая соль для `visitor_hash` |
| `cleanup` | ежедневно | удаляет файлы Storage без привязки, старые `jobs` |

---

## 10. i18n
- `next-intl`, файлы `src/i18n/messages/{locale}.json`, локали: `en` (fallback), `es`, `pt-BR`, `ru`, `ro`, `de`, `fr`, `tr`, `uk`, `pl`.
- Все строки интерфейса — только через ключи, никаких захардкоженных текстов. CI-проверка: все ключи из `en.json` есть во всех остальных файлах.
- Переводы первичные — сгенерировать, затем пометить в `CLAUDE.md`, что нужна вычитка носителем для лендинга, прайсинга и юридических страниц.
- Переключатель языка в хедере/футере; выбор сохраняется в cookie и в профиле.
- Даты, числа, валюты — через `Intl`.
- Email-шаблоны тоже локализованы (язык получателя).
- `hreflang` для маркетинговых страниц.

---

## 11. Дизайн-система
- **Темы:** светлая — фон `#FFFFFF`, поверхность `#F5F5F5`, текст `#0A0A0A`; тёмная — фон `#000000`, поверхность `#111111`, текст `#FAFAFA`. Границы — полупрозрачные нейтральные.
- **Акцент:** CSS-переменная `--accent` (по умолчанию `#FF6B00`) + `--accent-foreground` (вычисленный контрастный цвет). На публичной странице переменная берётся из `profiles.accent_color`.
- Тема: `light | dark | system`, для посетителя публичной страницы — тема, выбранная владельцем; на лендинге — системная + переключатель. Без мигания при загрузке (`next-themes` или inline-скрипт).
- **Шрифт:** Inter (или Geist) через `next/font`, поддержка кириллицы и латиницы с диакритикой (RO, PL, TR, DE).
- Стиль: минимализм, много воздуха, крупные обложки работ — работы главные, интерфейс вторичен. Скругления 12–16px. Плавные, быстрые анимации (≤200 мс), уважать `prefers-reduced-motion`.
- Mobile-first, всё проверяется на ширине 360px.

---

## 12. SEO и шаринг
- Публичная страница рендерится на сервере (SSR/ISR с ревалидацией при изменении профиля/работ).
- `<title>`: «{Имя} — {Headline} | Vitrin», meta description из bio.
- **Динамическая OG-картинка** профиля (`next/og`): аватар, имя, headline, 3 обложки работ, логотип Vitrin. Отдельная OG-картинка для `/w/{slug}` (обложка работы + автор).
- JSON-LD `Person` / `ProfilePage` на странице профиля.
- `sitemap.xml` (маркетинг + каталог + профили из каталога), `robots.txt`.
- Скрытые/забаненные профили — `noindex`, 404.

---

## 13. Нефункциональные требования
- **Производительность:** публичная страница — LCP < 2.5 с на 4G, Lighthouse Performance ≥ 90 (мобайл). Обложки — `next/image`, WebP/AVIF, lazy. Iframe'ы создаются только при открытии viewer'а, никогда в сетке.
- **Доступность:** WCAG 2.1 AA — фокус-кольца, навигация с клавиатуры (Tab по карточкам, Enter — развернуть, Esc — закрыть), `aria-label` на иконках, контраст.
- **Надёжность:** ошибки внешних сервисов не ломают страницу (fallback на OG-изображение / заглушку). Логирование ошибок (Sentry или Vercel logs — на выбор, по умолчанию Vercel).
- **Приватность:** без сторонних трекеров на публичных страницах; аналитика своя, без cookies; cookie-баннер только если добавятся сторонние cookies.
- **Код:** строгий TypeScript, без `any`; бизнес-логика покрыта юнит-тестами (определение типа ссылки, проверка iframe-заголовков, лимиты тарифов, валидация username, webhook Paddle); e2e — онбординг, добавление работы, открытие viewer'а, отправка заявки, апгрейд (Paddle sandbox).

---

## 14. План разработки по этапам

Каждый этап заканчивается рабочим задеплоенным состоянием на Vercel. После каждого пункта — коммит; после этапа — прогон тестов и чек-лист приёмки.

### Этап 1 — MVP (≈ неделя)
1. Инициализация: Next.js + TS + Tailwind + shadcn/ui + ESLint/Prettier, `CLAUDE.md`, env-шаблон, деплой пустого проекта на Vercel.
2. Supabase: миграции всех таблиц этапа 1 (`profiles, works, work_files, hire_requests, events, reports, jobs, moderation_log`), RLS, Storage-бакеты (`avatars`, `covers`, `screenshots`, `uploads`).
3. i18n-каркас с 10 локалями, дизайн-токены, темы light/dark/system, акцентная переменная.
4. Auth: Google, email+пароль, magic link, вход по username, Turnstile, подтверждение email.
5. Онбординг (5.2) с валидацией и резервированием username.
6. Ingest-пайплайн (5.3): нормализация, SSRF-защита, Web Risk, определение типа, метаданные, iframe-проверка, скриншоты через `ScreenshotProvider`, очередь `jobs`, Realtime-статусы.
7. Адаптеры этапа 1: `website` (live/screenshot), `figma`, `github`, `youtube`, `vimeo`, `loom`, `google_doc/slides`, `upload_image`.
8. Публичная страница (5.4): шапка, сетка, карточки с hover/тач-поведением, фильтр категорий.
9. Viewer (5.5) с DeviceSwitcher, deep link `/w/{slug}`, навигацией между работами.
10. Кабинет: обзор, работы (CRUD + drag-and-drop), профиль, входящие, настройки (тема, язык, удаление аккаунта).
11. Форма «Нанять меня» + Resend + «Входящие».
12. Базовая аналитика: запись событий, счётчик просмотров в кабинете.
13. Модерация: стоп-лист username, OpenAI Moderation текста и изображений, кнопка «Пожаловаться», простая админка (очередь + действия).
14. Лендинг (что это, как работает за 3 шага, примеры, прайсинг-блок «Pro скоро»), страницы Terms / Privacy / Refund.
15. SEO: SSR, OG-картинки, sitemap, robots.
16. Тесты и приёмка.

**Критерии приёмки этапа 1:**
- Новый пользователь через Google за ≤ 2 минуты получает страницу `vitrin.work/{username}` с работами из вставленных ссылок.
- Ссылка на сайт, запрещающий iframe (например GitHub-страница пользователя вне репозитория), корректно показывается скриншотом с кнопкой «Открыть сайт»; сайт, разрешающий iframe, — кликабелен в viewer'е.
- Прототип Figma кликабелен внутри viewer'а.
- Переключатель Desktop/Tablet/Mobile корректно масштабирует живой сайт.
- Заявка из формы приходит на почту фрилансеру и видна во «Входящих».
- Страница проходит Lighthouse Mobile ≥ 90 и работает на 360px.
- Все 10 языков переключаются, нет непереведённых ключей.
- Небезопасная ссылка (тестовые URL Google Safe Browsing) отклоняется.

### Этап 2 — Монетизация и каталог (≈ 1–2 недели)
1. Paddle: price'ы, checkout, webhooks, `subscriptions`, customer portal, страница `/pricing`, раздел «Подписка» в кабинете.
2. Лимиты тарифов через `plans.ts`, логика даунгрейда.
3. Pro-фичи: палитра акцентов, удаление брендинга, полная статистика (графики, по работам, источники, страны, устройства), приоритет в каталоге.
4. Каталог с поиском, фильтрами, SEO-страницами специализаций.
5. Вход через Facebook и Telegram.
6. Адаптеры: `notion`, `telegram_post`, `behance`, `dribbble`, `upload_video`, `upload_pdf`.
7. Cron: перепроверка ссылок, обновление скриншотов, письма о битых ссылках, еженедельный отчёт по просмотрам (опционально, отключаемо).
8. Расширенная админка (статистика платформы: регистрации, активные, Pro, MRR из Paddle).
9. Rate limiting через Upstash на всех публичных эндпоинтах.

**Критерии приёмки этапа 2:** оплата в Paddle sandbox переводит профиль в Pro за < 30 с после webhook'а; отмена корректно возвращает в Free в конце периода; каталог ищет с опечатками и фильтрует; Pro-пользователь видит полную статистику и меняет акцент.

### Этап 3 — Рост (после запуска)
- Кастомные домены для Pro (Vercel Domains API, инструкция по DNS, автоматический SSL).
- Экспорт портфолио в PDF.
- Отзывы клиентов (текст + имя + ссылка; опционально подтверждение по email клиента).
- Вход через Apple.
- Вложения-исходники к работам (`.aep`, `.fig`, `.psd`, `.zip`) — скачивание по кнопке, проверка файлов на вирусы.
- Реферальная программа (месяц Pro за приглашённого платящего).
- Импорт работ из GitHub-профиля / Behance-профиля одним кликом.
- Свой Playwright-воркер для скриншотов, если внешний API станет дорогим.

---

## 15. Переменные окружения (`.env.example`)
```
NEXT_PUBLIC_SITE_URL=https://vitrin.work
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SCREENSHOT_PROVIDER=microlink
MICROLINK_API_KEY=
GOOGLE_WEB_RISK_API_KEY=
OPENAI_API_KEY=
GITHUB_TOKEN=                      # для GitHub API (повышенные лимиты)
RESEND_API_KEY=
EMAIL_FROM="Vitrin <hello@vitrin.work>"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_PRICE_PRO_MONTHLY=
PADDLE_PRICE_PRO_YEARLY=
TELEGRAM_BOT_TOKEN=                # этап 2
TELEGRAM_BOT_USERNAME=
CRON_SECRET=
ANALYTICS_SALT_SEED=
```

## 16. Что нужно подготовить владельцу (не Claude Code)
- Домен `vitrin.work`, почта `hello@vitrin.work` (для Resend — DNS-записи SPF/DKIM).
- Аккаунты: Vercel, Supabase, Google Cloud (OAuth + Web Risk), OpenAI, Resend, Cloudflare (Turnstile), Upstash, Microlink, Paddle (sandbox → live после одобрения).
- Для Paddle live: юридические страницы, описание продукта, при необходимости — регистрация как ИП/компания в Молдове (уточнить у бухгалтера).
- Логотип и фавикон (можно на этапе 1 — текстовый логотип «vitrin» + оранжевая точка/окно).
- Этап 2: Telegram-бот через @BotFather (для входа через Telegram), Facebook App.

## 17. Открытые вопросы (решить до/во время этапа 2)
- Нужен ли пробный период Pro (например, 7 дней) или скидка на годовой план при запуске?
- Показывать ли в каталоге фрилансеров из всех стран сразу или дать фильтр по региону по умолчанию?
- Нужна ли региональная цена (дешевле для стран с низким доходом) — Paddle это поддерживает.
