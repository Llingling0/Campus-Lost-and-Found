import express from 'express';
import db, { nowIso } from '../db.js';
import { ok, fail, sanitize } from '../utils.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 用户提交反馈
router.post('/', auth(false), (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return fail(res, '反馈内容不能为空');

  db.prepare('INSERT INTO feedbacks(user_id, content, status, created_at) VALUES(?, ?, 1, ?)')
    .run(req.user.id, sanitize(content.trim()), nowIso());
  return ok(res, null, '反馈已提交，感谢您的意见');
});

// 用户查看自己的反馈列表
router.get('/my', auth(false), (req, res) => {
  const list = db.prepare(`
    SELECT f.*,
      CASE WHEN f.replied_by IS NOT NULL THEN u.nickname ELSE NULL END as replied_by_name
    FROM feedbacks f
    LEFT JOIN users u ON f.replied_by = u.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user.id);
  return ok(res, list);
});

// 管理员查看所有反馈
router.get('/', auth(true), (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT f.*, u.nickname as user_nickname, u.real_name as user_name,
      r.nickname as replied_by_name
    FROM feedbacks f
    LEFT JOIN users u ON f.user_id = u.id
    LEFT JOIN users r ON f.replied_by = r.id
  `;
  const params = [];
  if (status) { sql += ' WHERE f.status = ?'; params.push(Number(status)); }
  sql += ' ORDER BY f.created_at DESC';
  const list = db.prepare(sql).all(...params);
  return ok(res, list);
});

// 管理员回复反馈
router.post('/:id/reply', auth(true), (req, res) => {
  const { replyContent } = req.body;
  if (!replyContent || !replyContent.trim()) return fail(res, '回复内容不能为空');

  const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(req.params.id);
  if (!feedback) return fail(res, '反馈不存在');

  db.prepare('UPDATE feedbacks SET status = 2, reply_content = ?, replied_by = ?, replied_at = ?, updated_at = ? WHERE id = ?')
    .run(sanitize(replyContent.trim()), req.user.id, nowIso(), nowIso(), req.params.id);
  return ok(res, null, '已回复');
});

export default router;
