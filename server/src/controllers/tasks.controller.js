const tasks = require('../services/tasks.service');
const asyncHandler = require('../utils/asyncHandler');

const taskId = (req) => Number(req.params.id);

exports.list = asyncHandler(async (req, res) => {
  res.json({ tasks: await tasks.list(req.user.id, req.query) });
});

exports.reminders = asyncHandler(async (req, res) => {
  res.json({ tasks: await tasks.reminders(req.user.id) });
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json({ task: await tasks.create(req.user.id, req.body) });
});

exports.get = asyncHandler(async (req, res) => {
  res.json({ task: await tasks.get(taskId(req), req.user.id) });
});

exports.update = asyncHandler(async (req, res) => {
  res.json({ task: await tasks.update(taskId(req), req.user.id, req.body) });
});

exports.remove = asyncHandler(async (req, res) => {
  await tasks.remove(taskId(req), req.user.id);
  res.json({ message: 'Task deleted' });
});
