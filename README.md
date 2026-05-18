# EduMetric CRM

PDP University talabalari uchun grant CRM. Grant nizomi asosida ball hisoblanadi, qaror avtomatik.

## Stack

Vite + React + TS · Tailwind + shadcn/ui · Express + Prisma · PostgreSQL · Docker

## Lokal ishga tushirish

### 1. DB

```bash
docker compose up -d db
```

### 2. Backend

```bash
cd backend
cp .env.example .env
yarn install
yarn prisma:generate
yarn prisma:migrate
yarn seed
yarn dev
```

API: http://localhost:3001 · Swagger: http://localhost:3001/api/docs

### 3. Frontend

```bash
cd frontend
yarn install
yarn dev
```

UI: http://localhost:5173

## Demo logins

- Admin: `admin@pdp.uz` / `password123`
- Mentor: `mentor1@pdp.uz` / `password123`
- Student: `student1@pdp.uz` / `password123`

## To'liq deploy (VPS)

```bash
docker compose up -d --build
```

## Struktura

```
backend/    # Express + Prisma + Swagger
frontend/   # Vite + React + Tailwind
docs/       # Nizom, hackathon, design brief
docker-compose.yml
nginx.conf
```

Batafsil: [CLAUDE.md](./CLAUDE.md) · [docs/GRANT_NIZOM.md](./docs/GRANT_NIZOM.md) · [docs/DESIGN_BRIEF.md](./docs/DESIGN_BRIEF.md)
