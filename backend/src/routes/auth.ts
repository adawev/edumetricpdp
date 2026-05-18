import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { student: true, mentor: true },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
    return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.student ?? user.mentor ?? null,
    },
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { student: { include: { group: true } }, mentor: true },
  });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.student ?? user.mentor ?? null,
  });
});

authRouter.post('/logout', (_req, res) => res.json({ ok: true }));
