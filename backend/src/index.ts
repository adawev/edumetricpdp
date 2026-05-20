import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { authRouter } from './routes/auth.js';
import { studentRouter } from './routes/student.js';
import { mentorRouter } from './routes/mentor.js';
import { adminRouter } from './routes/admin.js';
import { publicRouter } from './routes/publicRoutes.js';
import { integrationsRouter } from './routes/integrations.js';
import { swaggerSpec } from './lib/swagger.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Yuklangan fayllar
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/students', studentRouter);
app.use('/api/mentor', mentorRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);
app.use('/api/integrations', integrationsRouter);
// @ts-expect-error swagger-ui-express bundles its own @types/express causing overload conflict
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`EduMetric API on :${port}`));
