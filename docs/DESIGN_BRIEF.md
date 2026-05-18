# Design Brief — EduMetric CRM

> Designer uchun to'liq kontekst. Bu faylni Claude'ga (design skill bilan) bersa, ekranlarni yarata oladi.

## Loyiha qisqacha

**EduMetric** — PDP University talabalari uchun grant CRM. Grant nizomi asosida talaba ballari hisoblanadi, grant qaror avtomatik chiqadi. 3 ta foydalanuvchi roli: **Student / Mentor / Admin**, plus loginsiz **Guest** sahifasi.

## Design tizimi

- **Stack**: Tailwind CSS + **shadcn/ui** komponentlari (Radix primitives asosida)
- **Stil**: minimalist, ko'p whitespace, neytral palette
- **Typography**: shadcn default (Inter), aniq hierarchy
- **Tema**: light + dark (shadcn token'lar orqali avtomatik)
- **Iconlar**: lucide-react
- **Grafiklar**: Recharts (line chart, bar chart, donut)
- **Til**: UI matnlari **o'zbek tilida**

### Rang sistemasi (shadcn neutral + accent)

- Primary: `slate-900` (dark text/CTA)
- Accent: `emerald-500` (positive — grant, approved, granted)
- Warning: `amber-500` (pending, GPA past)
- Danger: `red-500` (rejected, penalty, NOT_GRANTED)
- Muted: `slate-100`/`slate-500`
- Background: `white` / `slate-50`

### Tipik komponentlar (shadcn)

`Button`, `Card`, `Input`, `Select`, `Dialog`, `Sheet`, `Tabs`, `Table`, `Badge`, `Avatar`, `Progress`, `Sonner` (toast), `Form`, `DropdownMenu`, `Tooltip`, `Skeleton`.

---

## Sahifalar ro'yxati (jami ~15)

### 🔓 Public (loginsiz)

#### 1. `/login` — Login sahifasi
- Markazda card, email + password input, "Kirish" tugma
- Logo yuqorida, footer "© PDP University 2026"
- Xato bo'lsa toast (sonner)

#### 2. `/public/rating` — Mehmon reytingi
- Sarlavha: "PDP University talabalar reytingi"
- Filter: guruh tanlash (Select), qidiruv (Input)
- Jadval ustunlari: **#, Ism, Guruh, Ball, Status badge**
- Top-3 talaba uchun maxsus card'lar yuqorida (avatar + ism + ball)
- Pagination
- Header'da "Login" tugma o'ngda

---

### 🎓 Student paneli

#### 3. `/student/dashboard` — Asosiy
- Yuqorida 4 ta KPI card: **Grant Score**, **GPA**, **Davomat**, **Reytingda o'rin**
- O'rta: **Grant Score breakdown** (donut chart) — akademik/davomat/loyiha/faollik/tyutor/intizom ulushlari
- Past: **6 oylik o'sish dinamikasi** (line chart)
- O'ng kolonka: **Status banner** (GRANTED 🟢 / PENDING 🟡 / NOT_GRANTED 🔴) + sabab matn

#### 4. `/student/profile` — Profil
- Avatar, ism, email, guruh, mentor ismi
- "Mening ko'rsatkichlarim" — har mezon bo'yicha ball + progress bar
  - Akademik: 36/40 (GPA 90%)
  - Davomat: 16/20 (80%)
  - Loyihalar: 12/15
  - Faollik: 7/10
  - Tyutor bahosi: 4/5
  - Intizom: 9/10
- Penalty/Recovery/Employment bonus alohida bo'limda

#### 5. `/student/achievements` — Yutuqlar
- Yuqorida "+ Yangi yutuq qo'shish" tugma → Dialog ochiladi
  - Form: tur (Select: CERTIFICATE/HACKATHON/STARTUP/EMPLOYMENT/MENTORING/OTHER), nomi, tavsif, sana, fayl yuklash (sertifikat skan)
- Pastda jadval/card list: yutuq nomi, turi, sana, **status badge** (PENDING amber / APPROVED emerald / REJECTED red), ball
- Reject bo'lganlarda sabab tooltip

#### 6. `/student/feedbacks` — Mentor feedback'lari
- Card list: mentor ismi + avatar, score (5 ta yulduz), matn, sana
- Filter: davr (oxirgi oy / semestr / hammasi)

---

### 👨‍🏫 Mentor paneli

#### 7. `/mentor/dashboard` — Guruh ko'rinishi
- KPI: **Talabalar soni**, **O'rtacha ball**, **Risk zonadagilar** (GPA<80), **Bu hafta davomat**
- Jadval: top-5 va bottom-5 talaba
- Xavfli talabalar uchun red badge

#### 8. `/mentor/students` — Talabalar ro'yxati
- Jadval: ism, GPA, davomat, ball, status, "→" tugma (profilga)
- Filter: status, qidiruv
- Talaba qatoriga bosilganda Sheet (yon panel) ochiladi — qisqa profil + tezkor amallar

#### 9. `/mentor/feedback` — Feedback yozish
- Talaba tanlash (Select / qidiruv)
- Matn maydoni (textarea, 500 char limit)
- Score 1–5 (yulduzcha picker)
- "Yuborish" tugma
- Pastda — shu talabaga oldingi feedback'lar tarixi

---

### 👑 Admin paneli

#### 11. `/admin/dashboard` — Umumiy statistika
- KPI: **Jami talabalar**, **Grant olganlar**, **PENDING**, **NOT_GRANTED**, **O'rtacha ball**
- Donut: status taqsimoti
- Bar chart: guruhlar bo'yicha o'rtacha ball
- Tezkor amallar: "Kutilayotgan yutuqlar (12)" badge bilan

#### 12. `/admin/students` — Barcha talabalar
- Kuchli filter panel: guruh, status, GPA range, ball range, qidiruv
- Jadval: ism, guruh, mentor, GPA, ball, status, sana
- Qatorga bosish → talaba batafsil profili (Dialog yoki yangi sahifa)
- Bulk amallar (checkbox)

#### 13. `/admin/achievements` — Approve/reject paneli
- Tabs: **Kutilayotgan (12)** / **Tasdiqlangan** / **Rad etilgan**
- Card list: talaba ismi, yutuq nomi, turi, tavsif, sertifikat fayl preview
- Har card'da: **Tasdiqlash** (emerald), **Rad etish** (red, sabab so'raydi Dialog'da), ball qiymati input
- Sayoz, tez ishlatiladigan UI

#### 14. `/admin/penalties` — Jarima boshqaruvi
- "Yangi jarima" tugma → Dialog: talaba tanlash, tur (LIGHT −1 / MEDIUM −3 / HEAVY −5/-10/-15), sabab
- Pastda jarima tarixi jadval
- Har qatorda "Reabilitatsiya tayinlash" tugma → vazifa yozish
- Reabilitatsiya bajarilganda admin tasdiqlaydi → recovery ball qo'shiladi

#### 15. `/admin/grants` — Grant qaror paneli
- 2 ustunli layout:
  - **Chap**: kandidatlar (PENDING, ball ≥ 80, GPA ≥ 80%) — sortable ball bo'yicha
  - **O'ng**: Grant berildi (GRANTED)
- Drag-drop yoki "Grant berish" tugma har qatorda
- Yuqorida: **Slot qoldi**: X/Y indikator
- Qaror final qilinganda toast

#### 16. `/admin/rating` — Reyting
- Jadval: barcha talabalar, ball bo'yicha tartib
- Filter: guruh, kurs
- Export CSV tugma

#### 17. `/admin/integrations` — API kalitlar (bonus)
- API key yaratish, ko'rish, o'chirish
- Swagger linki
- Endpoint namuna: `POST /api/integrations/attendance`

---

## Umumiy layout

### Sidebar (autentifikatsiyalangan sahifalar)
- Chap tomonda kollapse bo'ladigan sidebar (256px / 64px)
- Yuqori: logo + "EduMetric"
- O'rta: nav linklar (rolga qarab)
- Past: avatar + user dropdown (profil, chiqish)

### Header
- Yuqori bar (h-14): breadcrumb chap, qidiruv markaz, bildirishnomalar + avatar o'ng
- Public sahifalarda boshqacha — markazlashgan, "Login" tugma o'ngda

### Status badge ranglari (consistent)

| Status | Rang | Matn |
|---|---|---|
| GRANTED | emerald | Grant berildi |
| PENDING | amber | Kutilmoqda |
| NOT_GRANTED | red | Grant yo'q |
| UNKNOWN | slate | Aniqlanmagan |
| APPROVED | emerald | Tasdiqlangan |
| REJECTED | red | Rad etilgan |

---

## Empty state'lar

Har bo'sh ekranda:
- Lucide icon (katta, muted)
- Sarlavha: "Hozircha hech narsa yo'q"
- Tavsif: nima qilish kerakligi
- CTA tugma (agar tegishli bo'lsa)

## Loading state'lar

Skeleton komponentlar — jadval va card'lar uchun.

## Error state'lar

Toast (sonner) + form'da inline xato matni.

---

## Responsive

- Desktop birinchi (hackathon demo laptop'da bo'ladi)
- Tablet — sidebar collapse
- Mobile — basic responsive, sidebar Sheet bo'ladi

---

## Demo uchun "wow" momentlar

1. **Grant Score donut** — chiroyli animatsiyali breakdown
2. **6 oylik o'sish line chart** — talabaning o'sishi
3. **Admin grant qaror paneli** — drag-drop yoki tez tugma'lar bilan slot to'ldirish
4. **Public rating** — top-3 podium card'lar (oltin/kumush/bronza accent)
5. **Dark mode toggle** — shadcn default, tez qo'shiladi

---

## Designer uchun Claude prompt namunasi

> "Build the EduMetric student dashboard page using shadcn/ui and Tailwind. Reference `docs/DESIGN_BRIEF.md` for full context. Page route: `/student/dashboard`. Include: 4 KPI cards (Grant Score, GPA, Attendance, Rating position), donut chart for score breakdown, line chart for 6-month growth, status banner. Language: Uzbek. Style: minimalist, generous whitespace, neutral palette with emerald/amber/red accents for status."

Har sahifa uchun shunday prompt yozib, designer Claude'ga yuboradi.
