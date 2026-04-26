import express from 'express';
import db, { genNo, nowIso } from '../db.js';
import { ok, fail } from '../utils.js';
import { auth } from '../middleware/auth.js';
import { notify } from '../services/notify.js';

const router = express.Router();

router.post('/', auth(false), (req, res) => {
  const { postId, verifyDesc, evidenceImages = [] } = req.body;
  const post = db.prepare('SELECT * FROM item_posts WHERE id=?').get(postId);
  if (!post) return fail(res, '信息不存在');
  if (post.status !== 2) return fail(res, '信息不可认领');

  const now = nowIso();
  const expiredAt = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
  db.prepare(`INSERT INTO claim_applications(apply_no, post_id, applicant_id, verify_desc, evidence_images, status, expired_at, created_at, updated_at)
    VALUES(?, ?, ?, ?, ?, 1, ?, ?, ?)`)
    .run(genNo('C'), postId, req.user.id, verifyDesc || '', JSON.stringify(evidenceImages), expiredAt, now, now);
  const claim = db.prepare('SELECT * FROM claim_applications WHERE rowid=last_insert_rowid()').get();

  notify(post.publisher_id, 3, claim.id, '收到认领申请', `你的信息【${post.title}】收到新的认领申请`);
  return ok(res, claim, '申请已提交');
});

router.get('/my', auth(false), (req, res) => {
  const list = db.prepare(`
    SELECT
      c.*,
      p.title AS post_title,
      p.occur_location AS post_occur_location,
      p.post_type AS post_type
    FROM claim_applications c
    LEFT JOIN item_posts p ON p.id = c.post_id
    WHERE c.applicant_id=?
    ORDER BY c.created_at DESC
  `).all(req.user.id);
  return ok(res, list);
});

router.get('/:id', auth(false), (req, res) => {
  const row = db.prepare('SELECT * FROM claim_applications WHERE id=?').get(req.params.id);
  if (!row) return fail(res, '记录不存在');
  if (row.applicant_id !== req.user.id && req.user.role !== 2) return fail(res, '无权限');
  return ok(res, { ...row, evidence_images: JSON.parse(row.evidence_images || '[]') });
});

router.post('/:id/cancel', auth(false), (req, res) => {
  const row = db.prepare('SELECT * FROM claim_applications WHERE id=?').get(req.params.id);
  if (!row) return fail(res, '记录不存在');
  if (row.applicant_id !== req.user.id) return fail(res, '无权限');
  if (row.status !== 1) return fail(res, '当前状态不可撤销');
  db.prepare('UPDATE claim_applications SET status=3, review_remark=?, reviewed_at=?, updated_at=? WHERE id=?')
    .run('用户撤销', nowIso(), nowIso(), row.id);
  return ok(res, null, '已撤销');
});

export default router;
