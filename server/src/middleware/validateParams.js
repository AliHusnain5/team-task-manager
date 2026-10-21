// router.param helper: rejects non-integer ids early.
module.exports = function intParam(req, res, next, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  next();
};
