import jwt from 'jsonwebtoken';
import db from '../db.js';
import { fail } from '../utils.js';

const SECRET = process.env.JWT_SECRET || 'campus-lost-found-secret';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
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
