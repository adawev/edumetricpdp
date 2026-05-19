# Design manbasi (source of truth)

Designer tomonidan tayyorlangan to'liq UI mockup. **Har bir dev shu dizaynga qarab implement qiladi.**

## URL

```
https://api.anthropic.com/v1/design/h/kWwooD0J5AMehLnm4RE7WQ?open_file=index.html
```

## Qanday foydalanasiz

### 1) Browserda ko'rish
Linkni brauzerda oching — barcha sahifalar (login, public rating, student/mentor/admin panellari) ishlaydi.

### 2) Claude Code'da implement qilish

O'z branch'ingizda (`feat/student-panel` / `feat/mentor-panel` / `feat/admin-panel`) Claude'ga shu prompt'ni bering:

```
Fetch this design file, read its readme, and implement the relevant aspects of the design.
https://api.anthropic.com/v1/design/h/kWwooD0J5AMehLnm4RE7WQ?open_file=index.html

Implement: <sizning sahifangiz, masalan: student/dashboard.html, student/rating.html, ...>

Tech stack:
- Vite + React + TypeScript
- Tailwind + shadcn/ui
- lucide-react, Recharts
- React Router, TanStack Query, Zustand (auth)
- Axios `api` instance @/lib/api dan
- Til: o'zbek

Mavjud kodga moslang:
- frontend/src/pages/student|mentor|admin/*.tsx
- API endpoint'lar uchun docs/CLAUDE.md va backend/src/routes/*.ts ga qarang
```

### 3) Qaysi dev qaysi sahifani qiladi

| Dev | Sahifalar |
|---|---|
| **Dev 1** (student) | `/student/dashboard`, `/student/profile`, `/student/achievements`, `/student/feedbacks`, `/student/rating`, `/student/:id` (public profil) |
| **Dev 2** (mentor) | `/mentor/dashboard`, `/mentor/students`, `/mentor/feedback`, `/mentor/discipline` |
| **Dev 3** (admin) | `/admin/dashboard`, `/admin/rating` (spreadsheet + select), `/admin/grants` (Grant qarori), `/admin/achievements`, `/admin/penalties`, `/admin/api-keys` |
| **Diyor (PM)** | `/login`, `/public/rating`, integration, code review |

### 4) Qoidalar

- **Designdan chetga chiqmang** — rang, spacing, komponent — hammasini iloji boricha aniq ko'chiring
- Backend allaqachon tayyor (`backend/src/routes/*.ts`) — siz faqat frontend ulaysiz
- API base: `/api/...` (proxy vite.config.ts da)
- Auth token: `useAuth()` hook'i (`@/lib/auth`)
- Bitganda: PR ochib `main`'ga merge so'rang
