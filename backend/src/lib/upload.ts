import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomBytes } from 'crypto';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = randomBytes(12).toString('hex') + ext;
    cb(null, name);
  },
});

const ALLOWED = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) return cb(new Error('Faqat PDF/PNG/JPG/WEBP ruxsat etilgan'));
    cb(null, true);
  },
});

export { uploadDir };
