import express from 'express';
import db from '../db.js';
import { ok, fail } from '../utils.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM announcements WHERE status=1 ORDER BY publish_at DESC, created_at DESC').all();
  return ok(res, rows);
});

router.get('/:id', (_req, res) => {
  const row = db.prepare('SELECT * FROM announcements WHERE id=?').get(_req.params.id);
  if (!row) return fail(res, '公告不存在');
  return ok(res, row);
});

router.post('/', auth(true), (req, res) => {
  const { title, content, status = 1, publishAt = null } = req.body;
  if (!title || !content) return fail(res, '标题和内容必填');
  db.prepare('INSERT INTO announcements(title, content, status, publish_at, created_by, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?)')
    .run(title, content, status, publishAt, req.user.id, new Date().toISOString(), new Date().toISOString());
  return ok(res, null, '创建成功');
});

router.put('/:id', auth(true), (req, res) => {
  const { title, content, status, publishAt } = req.body;
  db.prepare('UPDATE announcements SET title=?, content=?, status=?, publish_at=?, updated_at=? WHERE id=?')
    .run(title, content, status, publishAt, new Date().toISOString(), req.params.id);
  return ok(res, null, '更新成功');
});

export default router;
