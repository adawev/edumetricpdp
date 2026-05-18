# PDP University — Grant Nizomi (to'liq)

> Manba: rasmiy nizom (PDP EcoSystem). Bu fayl source-of-truth — barcha ball mantiqi shu yerdan.

## Grant maqsadi

Ijtimoiy himoyaga muhtoj, IT'ga ishtiyoqi bor talabalarni qo'llab-quvvatlash. Grant qoplaydi:
- O'qish to'lovi (kontrakt 50%–100%)
- Yotoqxona
- Kunlik 3 mahal ovqat

## Grant berish tartibi (2 bosqich)

1. **Reyting filtri** — ball asosida saralash, eng yuqorilari suhbatga.
2. **Yakuniy suhbat** — komissiya salohiyat va qadriyatlarga moslikni baholaydi.

## Saqlab qolish sharti

- Umumiy reytingda **≥ 80 ball**.
- Grant **kafolatlanmaydi** — 80+ orasida raqobat.
- **GPA < 80% → grant TO'XTATILADI** (qattiq filtr, istisno yo'q).

---

## Ball tizimi (max 100 + bonus/jarima)

| # | Mezon | Max |
|---|---|---|
| 1 | Akademik natija (GPA) | 40 |
| 2 | Davomat | 20 |
| 3 | Amaliy ko'nikmalar (loyihalar) | 15 |
| 4 | Faollik va sertifikatlar | 10 |
| 5 | Tyutor bahosi | 5 |
| 6 | Korporativ madaniyat / intizom | 10 |
| **Jami** | | **100** |
| — Penalty | -20 gacha |
| + Recovery | +10 gacha |
| + Employment | +10 gacha |

---

### 1. Akademik (40)

`ball = (gpa_foiz / 100) * 40`

GPA < 80% → keyingi semestr grant yo'q.

### 2. Davomat (20)

`ball = (davomat_foiz / 100) * 20`

### 3. Amaliy ko'nikmalar (15)

4 mezon: bajarish darajasi, deadline, sifat, mustaqillik. Copy-paste → 0.

**Topshiriladigan fanlar:**

| Semestr | 1-kurs | 2-kurs |
|---|---|---|
| 1-sem | ITS, Programming, Website | Mutaxassislik×2, Ingliz tili |
| 2-sem | Full Stack, BPM, Big Data | Mutaxassislik×2, Ingliz tili |

### 4. Faollik va sertifikatlar (10)

| Tur | Ball |
|---|---|
| Hackathon/Ideathon ishtirok | 1 |
| Musobaqa g'oliblik/sovrin | 3 gacha |
| Startup loyiha (himoya qilingan) | 7 gacha |
| Mentorlik (≥3 talabaga) | 3 |
| PDP Academy online kurs | 2 |
| PDP Academy offline kurs | 3 |
| Milliy IT sertifikat | 2 gacha |
| Til sertifikati (IELTS/CEFR) | 5 gacha |
| Xalqaro IT sertifikat (Google/AWS/MS/Cisco) | yuqori |
| Ijtimoiy faollik/volontyorlik | 1–2 |
| Soft skills trening | 1 |
| Networking (konferensiya + hisobot) | 1 |
| PDP Ecosystem loyiha (≥10s/hafta) | 2 |
| Yo'nalish rahbari yordamchisi | 3 |
| Strategik yordamchi (Rektor/Ta'sischi) | 4 gacha |

### 5. Tyutor bahosi (5)

5 yo'nalish: korporativ madaniyat/etika, ijtimoiy-ma'naviy faollik, soft skills, intizom (tyutor bilan aloqa), yotoqxona hayoti.

### 6. Korporativ madaniyat / intizom (10)

Baholash yo'nalishlari: akademik halollik (eng muhim), ichki tartib (dress code, mulkka munosabat), auditoriya intizomi (telefon, kechikish), yotoqxona, moliyaviy intizom.

**Moliyaviy intizom:**
- To'lov kechikishi → **−2 ball/hafta**
- 30 kundan oshsa → keyingi semestr grant saralashidan **chetlashtirish**
- Qarzdor talaba yakuniy imtihonlar va natijalardan cheklanishi mumkin

---

### 7. Penalty (−20 gacha)

| Daraja | Misol | Ball |
|---|---|---|
| Yengil | Darsga kechikish; darsda telefon; yotoqxona 2-bob qoidasini buzish | −1 har biri |
| O'rtacha | Sababsiz dars qoldirish; ogohlantirishni e'tiborsiz qoldirish; ichki tartibni qo'pol buzish | −3 har biri |
| Og'ir | Tizimli dars qoldirish | −5 |
| Og'ir | Jiddiy intizomiy muammo | −10 |
| Og'ir | Akademik firibgarlik (cheat/copy) | −15 |

**Maks**: bir semestrda jami penalty −20.

### 8. Recovery (+10 gacha)

- Tyutor/koordinator qo'shimcha vazifa tayinlaydi
- Namunali bajarilsa → penalty ballning **50% gacha** qaytariladi
- Maksimal +10

### 9. Employment bonus (+10 gacha)

| Tur | Bonus |
|---|---|
| Internship | 0–5 |
| Part-time IT (≥4s/kun) | 5–7 |
| Full-time IT | 7–10 |

Kompaniya nufuzi va lavozimga qarab.

---

## Validatsiya qoidalari (kod uchun)

```ts
// Qattiq filtr
if (gpa < 80) → status = NOT_GRANTED

// Hisoblash
academic   = (gpa / 100) * 40
attendance = (attend / 100) * 20
projects   = clamp(projectScore, 0, 15)
activity   = clamp(activityScore, 0, 10)
tutor      = clamp(tutorScore, 0, 5)
discipline = clamp(disciplineScore, 0, 10)

base    = academic + attendance + projects + activity + tutor + discipline   // max 100
penalty = clamp(penaltyTotal, 0, 20)
recovery= clamp(recoveryTotal, 0, min(penalty * 0.5, 10))                    // max 50% of penalty
employ  = clamp(employmentBonus, 0, 10)

total = base - penalty + recovery + employ                                    // max ~110

// Status
if (gpa < 80)            → NOT_GRANTED
else if (total >= 80)    → PENDING   // raqobatga kiradi
else                     → NOT_GRANTED
```
