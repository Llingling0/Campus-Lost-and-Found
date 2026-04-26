import express from 'express';
import db, { genNo, nowIso } from '../db.js';
import { ok, fail } from '../utils.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

function listImages(postId) {
  return db.prepare('SELECT id, img_url as imgUrl, sort_no as sortNo FROM item_post_images WHERE post_id=? ORDER BY sort_no ASC').all(postId);
}

router.get('/categories', (_req, res) => {
  const rows = db.prepare('SELECT id, name FROM item_categories WHERE status=1 ORDER BY sort_no ASC').all();
  return ok(res, rows);
});

router.post('/', auth(false), (req, res) => {
  const { postType, title, categoryId, occurTime, occurLocation, detail, contactInfo, rewardAmount, depositLocation, images = [], isDraft = true } = req.body;
  if (!postType || !title) return fail(res, 'postType/title必填');

  const now = nowIso();
  const cfg = db.prepare("SELECT config_value FROM system_configs WHERE config_key='max_daily_publish'").get();
  const maxDaily = Number(cfg?.config_value || 10);
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const dailyCount = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE publisher_id=? AND created_at >= ?').get(req.user.id, dayStart.toISOString()).c;
  if (!isDraft && dailyCount >= maxDaily) return fail(res, `今日发布已达上限${maxDaily}条`);

  const status = isDraft ? 0 : 1;
  db.prepare(`INSERT INTO item_posts(post_no, post_type, title, category_id, occur_time, occur_location, detail, contact_info, reward_amount, deposit_location, publisher_id, status, created_at, updated_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(genNo('P'), postType, title, categoryId || null, occurTime || null, occurLocation || null, detail || '', contactInfo || '', rewardAmount || 0, depositLocation || '', req.user.id, status, now, now);
  const post = db.prepare('SELECT * FROM item_posts WHERE rowid = last_insert_rowid()').get();

  if (Array.isArray(images)) {
    const stmt = db.prepare('INSERT INTO item_post_images(post_id, img_url, sort_no, created_at) VALUES(?, ?, ?, ?)');
    images.forEach((url, i) => stmt.run(post.id, url, i + 1, now));
  }

  return ok(res, { ...post, images: listImages(post.id) }, isDraft ? '草稿已保存' : '提交成功，待审核');
});

router.put('/:id', auth(false), (req, res) => {
  const { id } = req.params;
  const post = db.prepare('SELECT * FROM item_posts WHERE id=?').get(id);
  if (!post) return fail(res, '信息不存在');
  if (post.publisher_id !== req.user.id) return fail(res, '无权限');

  const {
    title = post.title, categoryId = post.category_id, occurTime = post.occur_time, occurLocation = post.occur_location,
    detail = post.detail, contactInfo = post.contact_info, rewardAmount = post.reward_amount,
    depositLocation = post.deposit_location, images = null
  } = req.body;

  db.prepare(`UPDATE item_posts SET title=?, category_id=?, occur_time=?, occur_location=?, detail=?, contact_info=?, reward_amount=?, deposit_location=?, updated_at=? WHERE id=?`)
    .run(title, categoryId, occurTime, occurLocation, detail, contactInfo, rewardAmount, depositLocation, nowIso(), id);

  if (Array.isArray(images)) {
    db.prepare('DELETE FROM item_post_images WHERE post_id=?').run(id);
    const stmt = db.prepare('INSERT INTO item_post_images(post_id, img_url, sort_no, created_at) VALUES(?, ?, ?, ?)');
    images.forEach((url, i) => stmt.run(id, url, i + 1, nowIso()));
  }

  const updated = db.prepare('SELECT * FROM item_posts WHERE id=?').get(id);
  return ok(res, { ...updated, images: listImages(id) }, '更新成功');
});

router.post('/:id/submit', auth(false), (req, res) => {
  const post = db.prepare('SELECT * FROM item_posts WHERE id=?').get(req.params.id);
  if (!post) return fail(res, '信息不存在');
  if (post.publisher_id !== req.user.id) return fail(res, '无权限');
  if (post.status !== 0 && post.status !== 3) return fail(res, '当前状态不可提交');
  db.prepare('UPDATE item_posts SET status=1, reject_reason=NULL, updated_at=? WHERE id=?').run(nowIso(), post.id);
  return ok(res, null, '已提交审核');
});

router.get('/', (req, res) => {
  const { postType, keyword = '', categoryId, status = 2, pageNo = 1, pageSize = 10 } = req.query;
  const where = ['1=1'];
  const params = [];
  if (postType) { where.push('post_type=?'); params.push(postType); }
  if (categoryId) { where.push('category_id=?'); params.push(categoryId); }
  if (status !== 'all') { where.push('status=?'); params.push(status); }
  if (keyword) { where.push('(title LIKE ? OR detail LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
  const base = `FROM item_posts WHERE ${where.join(' AND ')}`;
  const total = db.prepare(`SELECT COUNT(*) as c ${base}`).get(...params).c;
  const offset = (Number(pageNo) - 1) * Number(pageSize);
  const list = db.prepare(`SELECT * ${base} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), offset)
    .map(r => ({ ...r, images: listImages(r.id) }));
  return ok(res, { list, pageNo: Number(pageNo), pageSize: Number(pageSize), total });
});

router.get('/mine/list', auth(false), (req, res) => {
  const list = db.prepare('SELECT * FROM item_posts WHERE publisher_id=? AND status<>7 ORDER BY created_at DESC').all(req.user.id)
    .map(r => ({ ...r, images: listImages(r.id) }));
  return ok(res, list);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM item_posts WHERE id=?').get(req.params.id);
  if (!row) return fail(res, '信息不存在');
  const pub = db.prepare('SELECT id, nickname, avatar_url FROM users WHERE id=?').get(row.publisher_id);
  return ok(res, { ...row, publisher: pub, images: listImages(row.id) });
});

router.get('/:id/recommendations', (req, res) => {
  const row = db.prepare('SELECT * FROM item_posts WHERE id=?').get(req.params.id);
  if (!row) return fail(res, '信息不存在');
  
  // 智能匹配算法：计算相似度分数
  const list = db.prepare(`
    SELECT *, 
      CASE 
        WHEN category_id = ? THEN 30 
        ELSE 0 
      END +
      CASE 
        WHEN occur_location LIKE ? THEN 20 
        ELSE 0 
      END as similarity_score
    FROM item_posts 
    WHERE id <> ? AND post_type <> ? AND status = 2
    ORDER BY similarity_score DESC, created_at DESC 
    LIMIT 8
  `).all(row.category_id, `%${row.occur_location || ''}%`, row.id, row.post_type)
    .map(r => ({ ...r, images: listImages(r.id) }));
  
  return ok(res, list);
});

// 智能搜索接口（增强版）
router.get('/search/smart', (req, res) => {
  const { keyword = '', postType, categoryId, occurLocation, startTime, endTime, pageNo = 1, pageSize = 10 } = req.query;
  
  const where = ['status = 2'];
  const params = [];
  
  if (postType) { 
    where.push('post_type = ?'); 
    params.push(postType); 
  }
  if (categoryId) { 
    where.push('category_id = ?'); 
    params.push(categoryId); 
  }
  if (occurLocation) { 
    where.push('occur_location LIKE ?'); 
    params.push(`%${occurLocation}%`); 
  }
  if (startTime) { 
    where.push('created_at >= ?'); 
    params.push(startTime); 
  }
  if (endTime) { 
    where.push('created_at <= ?'); 
    params.push(endTime); 
  }
  
  // 关键词匹配（标题、描述、地点）
  if (keyword) {
    where.push('(title LIKE ? OR detail LIKE ? OR occur_location LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  const base = `FROM item_posts WHERE ${where.join(' AND ')}`;
  const total = db.prepare(`SELECT COUNT(*) as c ${base}`).get(...params).c;
  const offset = (Number(pageNo) - 1) * Number(pageSize);
  
  const list = db.prepare(`
    SELECT *,
      CASE 
        WHEN title LIKE ? THEN 50
        ELSE 0
      END +
      CASE 
        WHEN detail LIKE ? THEN 30
        ELSE 0
      END +
      CASE 
        WHEN occur_location LIKE ? THEN 20
        ELSE 0
      END as relevance_score
    ${base}
    ORDER BY relevance_score DESC, created_at DESC 
    LIMIT ? OFFSET ?
  `).all(
    ...params, 
    `%${keyword}%`, `%${keyword}%`, `%${keyword}%`,
    Number(pageSize), offset
  ).map(r => ({ ...r, images: listImages(r.id), relevanceScore: r.relevance_score }));
  
  return ok(res, { list, pageNo: Number(pageNo), pageSize: Number(pageSize), total });
});

router.delete('/:id', auth(false), (req, res) => {
  const row = db.prepare('SELECT * FROM item_posts WHERE id=?').get(req.params.id);
  if (!row) return fail(res, '信息不存在');
  if (row.publisher_id !== req.user.id) return fail(res, '无权限');
  if (![0,1,3].includes(row.status)) return fail(res, '当前状态不可删除');
  db.prepare('UPDATE item_posts SET status=7, updated_at=? WHERE id=?').run(nowIso(), row.id);
  return ok(res, null, '删除成功');
});

export default router;
