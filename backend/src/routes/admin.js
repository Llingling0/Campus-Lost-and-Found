import express from 'express';
import db, { nowIso } from '../db.js';
import { ok, fail } from '../utils.js';
import { auth } from '../middleware/auth.js';
import { notify } from '../services/notify.js';

const router = express.Router();

router.get('/posts/pending', auth(true), (_req, res) => {
  const list = db.prepare('SELECT * FROM item_posts WHERE status=1 ORDER BY created_at ASC').all();
  return ok(res, list);
});

router.post('/posts/:id/approve', auth(true), (req, res) => {
  const post = db.prepare('SELECT * FROM item_posts WHERE id=?').get(req.params.id);
  if (!post) return fail(res, '信息不存在');
  db.prepare('UPDATE item_posts SET status=2, audit_admin_id=?, audit_at=?, published_at=?, expire_at=?, updated_at=? WHERE id=?')
    .run(req.user.id, nowIso(), nowIso(), new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(), nowIso(), post.id);
  db.prepare('INSERT INTO post_audit_logs(post_id, admin_id, action, reason, created_at) VALUES(?, ?, 1, ?, ?)').run(post.id, req.user.id, '', nowIso());
  notify(post.publisher_id, 1, post.id, '审核通过', `你发布的【${post.title}】已通过审核`);
  return ok(res, null, '已通过');
});

router.post('/posts/:id/reject', auth(true), (req, res) => {
  const { reason = '信息不完整' } = req.body;
  const post = db.prepare('SELECT * FROM item_posts WHERE id=?').get(req.params.id);
  if (!post) return fail(res, '信息不存在');
  db.prepare('UPDATE item_posts SET status=3, reject_reason=?, audit_admin_id=?, audit_at=?, updated_at=? WHERE id=?')
    .run(reason, req.user.id, nowIso(), nowIso(), post.id);
  db.prepare('INSERT INTO post_audit_logs(post_id, admin_id, action, reason, created_at) VALUES(?, ?, 2, ?, ?)').run(post.id, req.user.id, reason, nowIso());
  notify(post.publisher_id, 1, post.id, '审核驳回', `你发布的【${post.title}】被驳回：${reason}`);
  return ok(res, null, '已驳回');
});

router.post('/posts/:id/delete', auth(true), (req, res) => {
  const { reason = '违规信息' } = req.body;
  const post = db.prepare('SELECT * FROM item_posts WHERE id=?').get(req.params.id);
  if (!post) return fail(res, '信息不存在');
  db.prepare('UPDATE item_posts SET status=7, reject_reason=?, audit_admin_id=?, audit_at=?, updated_at=? WHERE id=?')
    .run(reason, req.user.id, nowIso(), nowIso(), post.id);
  db.prepare('INSERT INTO post_audit_logs(post_id, admin_id, action, reason, created_at) VALUES(?, ?, 3, ?, ?)').run(post.id, req.user.id, reason, nowIso());
  return ok(res, null, '已删除');
});

router.get('/claims/pending', auth(true), (_req, res) => {
  const list = db.prepare('SELECT * FROM claim_applications WHERE status=1 ORDER BY created_at ASC').all();
  return ok(res, list);
});

router.post('/claims/:id/approve', auth(true), (req, res) => {
  const claim = db.prepare('SELECT * FROM claim_applications WHERE id=?').get(req.params.id);
  if (!claim) return fail(res, '申请不存在');
  db.prepare('UPDATE claim_applications SET status=2, reviewer_id=?, reviewed_at=?, updated_at=? WHERE id=?')
    .run(req.user.id, nowIso(), nowIso(), claim.id);
  db.prepare('UPDATE item_posts SET status=4, updated_at=? WHERE id=?').run(nowIso(), claim.post_id);
  notify(claim.applicant_id, 3, claim.id, '认领通过', '你的认领申请已通过，请线下交接');
  return ok(res, null, '认领已通过');
});

router.post('/claims/:id/reject', auth(true), (req, res) => {
  const { reason = '验证信息不匹配' } = req.body;
  const claim = db.prepare('SELECT * FROM claim_applications WHERE id=?').get(req.params.id);
  if (!claim) return fail(res, '申请不存在');
  db.prepare('UPDATE claim_applications SET status=3, reviewer_id=?, review_remark=?, reviewed_at=?, updated_at=? WHERE id=?')
    .run(req.user.id, reason, nowIso(), nowIso(), claim.id);
  notify(claim.applicant_id, 3, claim.id, '认领被拒绝', reason);
  return ok(res, null, '已拒绝');
});

router.get('/users', auth(true), (_req, res) => {
  const users = db.prepare('SELECT id, student_no, staff_no, real_name, mobile, nickname, role, status, created_at FROM users ORDER BY created_at DESC').all();
  return ok(res, users);
});

router.post('/users/:id/disable', auth(true), (req, res) => {
  db.prepare('UPDATE users SET status=2, updated_at=? WHERE id=?').run(nowIso(), req.params.id);
  return ok(res, null, '已禁用');
});

router.post('/users/:id/enable', auth(true), (req, res) => {
  db.prepare('UPDATE users SET status=1, updated_at=? WHERE id=?').run(nowIso(), req.params.id);
  return ok(res, null, '已解禁');
});

router.get('/stats/overview', auth(true), (_req, res) => {
  const totalPosts = db.prepare('SELECT COUNT(*) as c FROM item_posts').get().c;
  const found = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE status=4').get().c;
  const claimRate = totalPosts ? ((found / totalPosts) * 100).toFixed(2) : '0.00';
  const byType = db.prepare('SELECT category_id, COUNT(*) as count FROM item_posts GROUP BY category_id').all();
  return ok(res, { totalPosts, found, claimRate, byType });
});

// 全景监控看板数据
router.get('/dashboard', auth(true), (_req, res) => {
  // 今日新增发布
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayPosts = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE created_at >= ?').get(todayStart.toISOString()).c;

  // 待审核信息
  const pendingPosts = db.prepare('SELECT * FROM item_posts WHERE status=1 ORDER BY created_at ASC LIMIT 10').all();
  const pendingCount = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE status=1').get().c;

  // 待处理认领
  const pendingClaims = db.prepare('SELECT c.*, p.title as post_title, p.post_type FROM claim_applications c LEFT JOIN item_posts p ON c.post_id=p.id WHERE c.status=1 ORDER BY c.created_at ASC LIMIT 10').all();
  const pendingClaimCount = db.prepare('SELECT COUNT(*) as c FROM claim_applications WHERE status=1').get().c;

  // 总体统计
  const totalPosts = db.prepare('SELECT COUNT(*) as c FROM item_posts').get().c;
  const publishedPosts = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE status=2').get().c;
  const foundPosts = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE status=4').get().c;
  const rejectedPosts = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE status=3').get().c;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

  // 失物/招领分布
  const lostCount = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE post_type=1').get().c;
  const foundTypeCount = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE post_type=2').get().c;

  // 异常状态（超时未处理等）
  const timeoutClaims = db.prepare('SELECT COUNT(*) as c FROM claim_applications WHERE status=1 AND expired_at < ?').get(nowIso()).c;
  const expiredPosts = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE status=5').get().c;

  return ok(res, {
    stats: {
      totalPosts,
      publishedPosts,
      pendingCount,
      foundPosts,
      rejectedPosts,
      totalUsers,
      todayPosts,
      lostCount,
      foundTypeCount,
      pendingClaimCount,
      timeoutClaims,
      expiredPosts,
      claimRate: totalPosts ? ((foundPosts / totalPosts) * 100).toFixed(1) : '0'
    },
    pendingPosts,
    pendingClaims
  });
});

router.get('/stats/export', auth(true), (_req, res) => {
  const rows = db.prepare('SELECT post_no, post_type, title, status, created_at FROM item_posts ORDER BY created_at DESC').all();
  const header = 'post_no,post_type,title,status,created_at\n';
  const body = rows.map(r => `${r.post_no},${r.post_type},"${String(r.title).replace(/"/g, '""')}",${r.status},${r.created_at}`).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  return res.send(`\uFEFF${header}${body}`);
});

router.get('/configs', auth(true), (_req, res) => {
  const rows = db.prepare('SELECT config_key, config_value, description FROM system_configs').all();
  return ok(res, rows);
});

router.put('/configs', auth(true), (req, res) => {
  const { configs = [] } = req.body;
  const stmt = db.prepare('UPDATE system_configs SET config_value=?, updated_at=? WHERE config_key=?');
  configs.forEach(c => stmt.run(String(c.configValue), nowIso(), c.configKey));
  return ok(res, null, '配置已更新');
});

export default router;
