export function ok(res, data = {}, message = 'ok') {
  return res.json({ code: 0, message, data });
}

export function fail(res, message = 'error', code = 400) {
  return res.status(200).json({ code, message, data: null });
}
