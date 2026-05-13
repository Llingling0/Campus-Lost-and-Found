import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import db, { initDb, nowIso } from './db.js';
import { ok } from './utils.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import claimRoutes from './routes/claims.js';
import notificationRoutes from './routes/notifications.js';
import announcementRoutes from './routes/announcements.js';
import adminRoutes from './routes/admin.js';
import feedbackRoutes from './routes/feedbacks.js';

initDb();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve('uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    // Use timestamp + random hex to avoid encoding issues with non-ASCII filenames
    const ext = path.extname(file.originalname) || '';
    const safeName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.get('/api/v1/health', (_req, res) => ok(res, { time: nowIso() }));
app.post('/api/v1/uploads/image', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.json({ code: 400, message: '文件大小不能超过 5MB', data: null });
      return res.json({ code: 400, message: '文件上传失败', data: null });
    }
    if (!req.file) return res.json({ code: 400, message: '请选择要上传的图片', data: null });
    ok(res, { url: `/uploads/${req.file.filename}` });
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/claims', claimRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/feedbacks', feedbackRoutes);

// Multer error handler — return JSON instead of HTML crash page
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.json({ code: 400, message: '文件大小不能超过 5MB', data: null });
  }
  if (err.message?.includes('MulterError') || err.name === 'MulterError') {
    return res.json({ code: 400, message: '文件上传失败', data: null });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

setInterval(() => {
  const now = nowIso();
  db.prepare('UPDATE claim_applications SET status=4, review_remark=?, reviewed_at=?, updated_at=? WHERE status=1 AND expired_at < ?')
    .run('超时自动驳回', now, now, now);
  db.prepare('UPDATE item_posts SET status=5, updated_at=? WHERE status=2 AND expire_at IS NOT NULL AND expire_at < ?')
    .run(now, now);
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`Backend running: http://localhost:${PORT}`);
});
