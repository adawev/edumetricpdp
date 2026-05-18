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
- Jamoa 3–5 kishi, bitta repo, noldan, vibe coding ok
- MVP fokus: auth + 3 rol + score + yutuq workflow + public rating
- Demo golden path: login → score → yutuq → admin approve → ball yangilandi → reytingda ko'rinadi

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
