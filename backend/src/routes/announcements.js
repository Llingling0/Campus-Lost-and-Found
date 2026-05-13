import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import db from '../db.js';
import { ok, fail, sanitize } from '../utils.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve('uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// 上传公告图片
router.post('/upload-image', auth(true), (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.json({ code: 400, message: '文件大小不能超过 5MB', data: null });
      return res.json({ code: 400, message: '文件上传失败', data: null });
    }
    if (!req.file) return res.json({ code: 400, message: '请选择要上传的图片', data: null });
    ok(res, { url: `/uploads/${req.file.filename}` });
  });
});

// 公开：获取已发布公告
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM announcements WHERE status=1 ORDER BY publish_at DESC, created_at DESC').all();
  return ok(res, rows);
});

// 管理员：获取所有公告（含草稿）
router.get('/all', auth(true), (_req, res) => {
  const rows = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
  return ok(res, rows);
});

router.get('/:id', (_req, res) => {
  const row = db.prepare('SELECT * FROM announcements WHERE id=?').get(_req.params.id);
  if (!row) return fail(res, '公告不存在');
  return ok(res, row);
});

router.post('/', auth(true), (req, res) => {
  const { title, content, imageUrl, status = 1, publishAt = null } = req.body;
  if (!title || !content) return fail(res, '标题和内容必填');
  db.prepare('INSERT INTO announcements(title, content, image_url, status, publish_at, created_by, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)')
    .run(sanitize(title), sanitize(content), imageUrl || null, status, publishAt, req.user.id, new Date().toISOString(), new Date().toISOString());
  return ok(res, null, '创建成功');
});

router.put('/:id', auth(true), (req, res) => {
  const { title, content, imageUrl, status, publishAt } = req.body;
  db.prepare('UPDATE announcements SET title=?, content=?, image_url=?, status=?, publish_at=?, updated_at=? WHERE id=?')
    .run(sanitize(title), sanitize(content), imageUrl || null, status, publishAt, new Date().toISOString(), req.params.id);
  return ok(res, null, '更新成功');
});

// 管理员：删除公告
router.delete('/:id', auth(true), (req, res) => {
  const row = db.prepare('SELECT * FROM announcements WHERE id=?').get(req.params.id);
  if (!row) return fail(res, '公告不存在');
  db.prepare('DELETE FROM announcements WHERE id=?').run(req.params.id);
  return ok(res, null, '已删除');
});

export default router;
