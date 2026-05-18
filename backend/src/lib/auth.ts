import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export type JwtPayload = { userId: string; role: Role };

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
export const signToken = (payload: JwtPayload) => jwt.sign(payload, SECRET, { expiresIn: '7d' });
export const verifyToken = (token: string) => jwt.verify(token, SECRET) as JwtPayload;
