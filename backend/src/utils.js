export function ok(res, data = {}, message = 'ok') {
  return res.json({ code: 0, message, data });
}

export function fail(res, message = 'error', code = 400) {
  return res.status(200).json({ code, message, data: null });
}

export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
