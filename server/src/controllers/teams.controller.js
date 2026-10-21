const teams = require('../services/teams.service');
const asyncHandler = require('../utils/asyncHandler');

const teamId = (req) => Number(req.params.id);

exports.list = asyncHandler(async (req, res) => {
  res.json({ teams: await teams.list(req.user.id) });
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json({ team: await teams.create(req.user.id, req.body) });
});

exports.details = asyncHandler(async (req, res) => {
  res.json(await teams.details(teamId(req), req.user.id));
});

exports.update = asyncHandler(async (req, res) => {
  res.json({ team: await teams.update(teamId(req), req.user.id, req.body) });
});

exports.remove = asyncHandler(async (req, res) => {
  await teams.remove(teamId(req), req.user.id);
  res.json({ message: 'Team deleted' });
});

exports.addMember = asyncHandler(async (req, res) => {
  const member = await teams.addMember(teamId(req), req.user.id, req.body.email);
  res.status(201).json({ member });
});

exports.invite = asyncHandler(async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const result = await teams.invite(teamId(req), req.user.id, req.body.email, baseUrl);
  res.status(202).json(result);
});

exports.removeMember = asyncHandler(async (req, res) => {
  await teams.removeMember(teamId(req), req.user.id, Number(req.params.userId));
  res.json({ message: 'Member removed' });
});
