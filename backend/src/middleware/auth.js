import jwt from 'jsonwebtoken';
import db from '../db.js';
import { fail } from '../utils.js';

const SECRET = process.env.JWT_SECRET || 'campus-lost-found-secret';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export function recordLoginAttempt(identifier, success) {
  db.prepare('INSERT INTO login_attempts(identifier, success, created_at) VALUES(?, ?, ?)')
    .run(identifier, success ? 1 : 0, new Date().toISOString());
}

export function isLockedOut(identifier) {
  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
  const attempts = db.prepare(
    'SELECT * FROM login_attempts WHERE identifier = ? AND created_at > ? ORDER BY created_at DESC LIMIT ?'
  ).all(identifier, since, MAX_ATTEMPTS);

  if (attempts.length < MAX_ATTEMPTS) return false;
  return attempts.every(a => a.success === 0);
}

export function getRemainingLockMinutes(identifier) {
  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
  const attempts = db.prepare(
    'SELECT * FROM login_attempts WHERE identifier = ? AND created_at > ? ORDER BY created_at DESC LIMIT ?'
  ).all(identifier, since, MAX_ATTEMPTS);

  if (attempts.length < MAX_ATTEMPTS || !attempts.every(a => a.success === 0)) return 0;
  const oldest = new Date(attempts[attempts.length - 1].created_at);
  const unlockAt = new Date(oldest.getTime() + LOCKOUT_MINUTES * 60 * 1000);
  return Math.ceil((unlockAt.getTime() - Date.now()) / 60000);
}

export function auth(requiredAdmin = false) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return fail(res, '未登录', 401);
    try {
      const decoded = jwt.verify(token, SECRET);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
      if (!user || user.status !== 1) return fail(res, '用户不可用', 403);
      if (requiredAdmin && user.role !== 2) return fail(res, '无管理员权限', 403);
      req.user = user;
      next();
    } catch (e) {
      return fail(res, '登录已过期', 401);
    }
  };
}
