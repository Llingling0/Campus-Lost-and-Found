const Database = require('better-sqlite3');

const db = new Database('campus_lost_found.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid TEXT UNIQUE NOT NULL,
    student_no TEXT,
    staff_no TEXT,
    real_name TEXT,
    mobile TEXT,
    nickname TEXT,
    avatar_url TEXT,
    college TEXT,
    class_name TEXT,
    role INTEGER DEFAULT 1,
    status INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS item_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    status INTEGER DEFAULT 1,
    sort_no INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS item_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_no TEXT UNIQUE NOT NULL,
    post_type INTEGER NOT NULL,
    title TEXT NOT NULL,
    category_id INTEGER,
    occur_time TEXT,
    occur_location TEXT,
    detail TEXT,
    contact_info TEXT,
    reward_amount REAL DEFAULT 0,
    deposit_location TEXT,
    publisher_id INTEGER NOT NULL,
    status INTEGER DEFAULT 0,
    reject_reason TEXT,
    audit_admin_id INTEGER,
    audit_at TEXT,
    published_at TEXT,
    expire_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES item_categories(id),
    FOREIGN KEY (publisher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS item_post_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    img_url TEXT NOT NULL,
    sort_no INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES item_posts(id)
  );

  CREATE TABLE IF NOT EXISTS claim_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apply_no TEXT UNIQUE NOT NULL,
    post_id INTEGER NOT NULL,
    applicant_id INTEGER NOT NULL,
    verify_desc TEXT,
    evidence_images TEXT,
    status INTEGER DEFAULT 1,
    reviewer_id INTEGER,
    review_remark TEXT,
    reviewed_at TEXT,
    expired_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES item_posts(id),
    FOREIGN KEY (applicant_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS post_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    action INTEGER NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status INTEGER DEFAULT 1,
    publish_at TEXT,
    created_by INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    biz_type INTEGER NOT NULL,
    biz_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    read_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    status INTEGER DEFAULT 1,
    reply_content TEXT,
    replied_by INTEGER,
    replied_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS system_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_posts_type_status ON item_posts(post_type, status, created_at);
  CREATE INDEX IF NOT EXISTS idx_posts_publisher ON item_posts(publisher_id, status);
  CREATE INDEX IF NOT EXISTS idx_claims_post_status ON claim_applications(post_id, status);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);
`);

// Seed data
const now = new Date().toISOString();

// Insert categories if empty
const catCount = db.prepare('SELECT COUNT(*) as c FROM item_categories').get().c;
if (catCount === 0) {
  const categories = ['证件', '电子产品', '衣物', '书籍', '钥匙', '数码配件'];
  const stmt = db.prepare('INSERT INTO item_categories(name, sort_no, created_at, updated_at) VALUES(?, ?, ?, ?)');
  categories.forEach((name, idx) => stmt.run(name, idx + 1, now, now));
  console.log('Inserted categories');
}

// Insert system configs if empty
const cfgCount = db.prepare('SELECT COUNT(*) as c FROM system_configs').get().c;
if (cfgCount === 0) {
  const cfgStmt = db.prepare('INSERT INTO system_configs(config_key, config_value, description, updated_at) VALUES(?, ?, ?, ?)');
  cfgStmt.run('max_daily_publish', '10', '每日最大发布数', now);
  cfgStmt.run('audit_timeout_hours', '24', '审核超时小时数', now);
  cfgStmt.run('claim_timeout_hours', '72', '认领处理超时小时数', now);
  cfgStmt.run('post_expire_days', '90', '信息过期天数', now);
  console.log('Inserted system configs');
}

// Insert admin user if not exists
const admin = db.prepare("SELECT id FROM users WHERE openid='admin_openid'").get();
if (!admin) {
  db.prepare(`INSERT INTO users(openid, real_name, mobile, nickname, role, status, created_at, updated_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('admin_openid', '系统管理员', '13800000000', '管理员', 2, 1, now, now);
  console.log('Inserted admin user');
}

console.log('Database initialized successfully');

db.close();
