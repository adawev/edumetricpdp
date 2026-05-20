-- Bitta mentor → bitta talaba uchun bitta feedback.
-- 1) Duplicate yozuvlarni tozalaymiz: har juftda eng yangisi (createdAt DESC) qoladi.
DELETE FROM "Feedback" f
USING (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY "studentId", "mentorId"
           ORDER BY "createdAt" DESC
         ) AS rn
  FROM "Feedback"
) d
WHERE f.id = d.id AND d.rn > 1;

-- 2) updatedAt ustuni
ALTER TABLE "Feedback" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Feedback" SET "updatedAt" = "createdAt";
ALTER TABLE "Feedback" ALTER COLUMN "updatedAt" SET NOT NULL;

-- 3) Unique constraint
CREATE UNIQUE INDEX "Feedback_studentId_mentorId_key" ON "Feedback"("studentId", "mentorId");
