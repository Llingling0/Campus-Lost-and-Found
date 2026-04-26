import express from 'express';
import db, { nowIso } from '../db.js';
import { ok } from '../utils.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth(false), (req, res) => {
  const list = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC').all(req.user.id);
  return ok(res, { list, total: list.length });
});

router.get('/unread-count', auth(false), (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND is_read=0').get(req.user.id).c;
  return ok(res, { count });
});

router.post('/:id/read', auth(false), (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1, read_at=? WHERE id=? AND user_id=?').run(nowIso(), req.params.id, req.user.id);
  return ok(res, null, '已读');
});

router.post('/read-all', auth(false), (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1, read_at=? WHERE user_id=? AND is_read=0').run(nowIso(), req.user.id);
  return ok(res, null, '全部已读');
});

export default router;
