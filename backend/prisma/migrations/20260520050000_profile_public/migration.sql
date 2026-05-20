-- Add profilePublic field to Student
ALTER TABLE "Student" ADD COLUMN "profilePublic" BOOLEAN NOT NULL DEFAULT false;
