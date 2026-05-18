# EduMetric CRM — Project instructions

PDP University talabalari uchun grant CRM. Grant nizomi asosida ball hisoblanadi va grant qaror avtomatik aniqlanadi.

## Tech stack (global default'ni override qiladi)

- **Frontend**: Vite + React + TypeScript + Tailwind + shadcn/ui + Recharts
- **Backend**: Node.js + Express + TypeScript
- **DB**: PostgreSQL + Prisma ORM
- **Auth**: JWT + bcrypt
- **Deploy**: Docker Compose + Nginx + Certbot (VPS Ubuntu)
- **Package manager**: yarn (frontend va backend ikkalasida ham)

> Diqqat: global CLAUDE.md da backend Java+Spring deyilgan — bu loyiha **Node+Express**.

## Monorepo strukturasi

```
EduMetricPDP/
├── frontend/          # Vite + React
├── backend/           # Express + Prisma
├── docker-compose.yml
├── nginx.conf
└── CLAUDE.md
```

## Rollar

- **Student** — profil, score, yutuq kiritish, feedback ko'rish, reyting
- **Mentor** — guruh ko'rish, davomat, intizom, feedback
- **Admin** — talabalar/guruhlar, yutuq approve, jarima, grant qaror, reyting
- **Guest** — loginsiz umumiy reyting (`/public/rating`)

## Grant ball (max 100)

| Mezon | Max |
|---|---|
| Akademik (GPA) | 40 |
| Davomat | 20 |
| Loyihalar | 15 |
| Faollik/sertifikat | 10 |
| Mentor bahosi | 5 |
| Intizom | 10 |

Bonus/jarima: Penalty -20, Recovery +10, Employment +10.

## Grant qoidalari (qattiq)

- **GPA < 80% → grant YO'Q (qattiq filtr, istisno yo'q).**
- Asosiy ball ≥ 80 → raqobatga kiradi (slot cheklangan, 80+ kafolat emas).
- Yutuq kiritilganda status `PENDING`, faqat admin approve qilgach ball qo'shiladi.
- Penalty max -20, Recovery max +10 (yo'qotilgan ballning 50% gacha qaytariladi).
- Har talaba harakati `ActivityLog`'ga yoziladi.

## Score formulasi

```ts
academic   = (gpa / 100) * 40
attendance = (attendance / 100) * 20
projects   = projectScore * 0.15
activity   = activityScore * 0.10
tutor      = tutorScore * 0.05
discipline = disciplineScore * 0.10

base  = academic + attendance + projects + activity + tutor + discipline
total = min(base - min(penalty,20) + min(recovery,10) + min(employment,10), 110)

status = gpa < 80 ? NOT_GRANTED
       : total >= 80 ? PENDING
       : NOT_GRANTED
```

## To'liq spec

- [docs/GRANT_NIZOM.md](docs/GRANT_NIZOM.md) — rasmiy grant nizomi, aniq ball qiymatlari (source of truth)
- [docs/HACKATHON.md](docs/HACKATHON.md) — Unicorn Hackathon (2026-05-18) qoidalari, talablari, baholash signallari
- Boshlang'ich prompt: WSL `~/edumetric_claude_code_prompt.md`

## Kontekst (jamoa)

- Hackathon: **Unicorn Hackathon**, 2026-05-18 14:00, PDP University
- Jamoa: 5 kishi
  - 1 designer
  - 3 developer (har biri 1 rol: student / mentor / admin panel)
  - **Diyor (men)** — PM, umumiy owner, public rating sahifasi, grant engine (score formula + status logic)
- MVP fokus: auth + 3 rol + score + yutuq workflow + public rating + integration API
- Demo golden path: login → score → yutuq qo'shildi → admin approve → ball yangilandi → reytingda ko'rinadi

## MVP qarorlari (muhokama qilingan)

- **Public rating**: to'liq ism + guruh + ball (anonim emas).
- **Integration API**: API key auth + Swagger + 2 endpoint (`POST /api/integrations/attendance`, `POST /api/integrations/grades`). Bulk array qabul qiladi.
- **Interview bosqichi**: MVP'da YO'Q. Nizomda bor, lekin vaqt tejash uchun tashlanadi.
- **Score formula**: nizom bo'yicha aniq (docs/GRANT_NIZOM.md). GPA<80 qattiq filtr.
- **Seed data**: demo uchun majburiy — 10–20 talaba, 2 mentor, 1 admin, API key namuna.

## Mas'uliyat taqsimoti

| Kim | Nima |
|---|---|
| Diyor (PM) | Repo owner, grant engine, public rating, integration API, code review |
| Designer | shadcn/ui asosida ekranlar, demo screenshot'lar |
| Dev 1 | Student panel (dashboard, profil, yutuq kiritish, feedback ko'rish) |
| Dev 2 | Mentor panel (guruh, davomat, feedback, intizom) |
| Dev 3 | Admin panel (talabalar, approve/reject, jarima, grant qaror, reyting) |

## Workflow

- Har feature uchun alohida branch: `feat/<nom>`. Bitgach commit → PR → merge → branch o'chiriladi.
- Worktree ishlatilmaydi.
- `git push` faqat user aytganda.
- Commit message inglizcha, scoped (`feat:`, `fix:`, `chore:` …).

## Design

- shadcn/ui default. Minimalist, ko'p whitespace, neytral palette.
- Tailwind tokens orqali.

## Eslatmalar

- `.env` fayllariga **tegmaslik**. Qiymat kerak bo'lsa userdan so'rash.
- Terminal: faqat WSL Ubuntu (Bash tool, PowerShell yo'q).
