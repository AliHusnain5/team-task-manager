const pool = require('../db/pool');
const HttpError = require('../utils/httpError');

// Returns 'owner' | 'member' | null for a user in a team.
async function getRole(teamId, userId) {
  const { rows } = await pool.query(
    'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  return rows[0] ? rows[0].role : null;
}

// Non-members get a 404 so team ids cannot be probed.
async function requireMember(teamId, userId) {
  const role = await getRole(teamId, userId);
  if (!role) throw new HttpError(404, 'Team not found');
  return role;
}

async function requireOwner(teamId, userId, action) {
  const role = await requireMember(teamId, userId);
  if (role !== 'owner') throw new HttpError(403, `Only the team owner can ${action}`);
}

async function list(userId) {
  const { rows } = await pool.query(
    `SELECT t.id, t.name, t.description, t.created_by AS "createdBy", m.role,
            (SELECT COUNT(*)::int FROM team_members WHERE team_id = t.id) AS "memberCount"
       FROM teams t
       JOIN team_members m ON m.team_id = t.id AND m.user_id = $1
      ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows;
}

// The creator becomes the owner (both inserts in one transaction).
async function create(userId, { name, description }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3)
       RETURNING id, name, description, created_by AS "createdBy"`,
      [name, description, userId]
    );
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [rows[0].id, userId]
    );
    await client.query('COMMIT');
    return { ...rows[0], role: 'owner', memberCount: 1 };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function details(teamId, userId) {
  const role = await requireMember(teamId, userId);
  const team = await pool.query(
    'SELECT id, name, description, created_by AS "createdBy" FROM teams WHERE id = $1',
    [teamId]
  );
  const members = await pool.query(
    `SELECT u.id, u.name, u.email, m.role
       FROM team_members m JOIN users u ON u.id = m.user_id
      WHERE m.team_id = $1 ORDER BY m.joined_at`,
    [teamId]
  );
  return { team: { ...team.rows[0], role }, members: members.rows };
}

async function update(teamId, userId, { name, description }) {
  await requireOwner(teamId, userId, 'edit the team');
  const { rows } = await pool.query(
    `UPDATE teams SET name = $1, description = $2 WHERE id = $3
     RETURNING id, name, description, created_by AS "createdBy"`,
    [name, description, teamId]
  );
  return rows[0];
}

// Tasks and memberships are removed by ON DELETE CASCADE.
async function remove(teamId, userId) {
  await requireOwner(teamId, userId, 'delete the team');
  await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);
}

async function addMember(teamId, userId, email) {
  await requireOwner(teamId, userId, 'add members');
  const user = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
  if (!user.rows[0]) {
    throw new HttpError(404, 'No registered user with that email. Try sending an invite.');
  }
  const inserted = await pool.query(
    `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')
     ON CONFLICT DO NOTHING`,
    [teamId, user.rows[0].id]
  );
  if (inserted.rowCount === 0) {
    throw new HttpError(409, 'User is already a member of this team');
  }
  return { ...user.rows[0], role: 'member' };
}

// Bonus: invite by email. Stubbed (no SMTP): it only logs the invite.
async function invite(teamId, userId, email, baseUrl) {
  await requireOwner(teamId, userId, 'invite members');
  const inviteLink = `${baseUrl}/?invite=team-${teamId}`;
  console.log(`[invite stub] to=${email} team=${teamId} link=${inviteLink}`);
  return {
    message: `Invite to ${email} queued (stubbed, no email is actually sent).`,
    inviteLink,
  };
}

// Owner removes others; any member can leave. The owner cannot be removed.
async function removeMember(teamId, actorId, targetId) {
  const role = await requireMember(teamId, actorId);
  if (targetId !== actorId && role !== 'owner') {
    throw new HttpError(403, 'Only the team owner can remove other members');
  }
  const targetRole = await getRole(teamId, targetId);
  if (!targetRole) throw new HttpError(404, 'Member not found');
  if (targetRole === 'owner') {
    throw new HttpError(400, 'The team owner cannot be removed. Delete the team instead.');
  }
  await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, targetId]);
  await pool.query('UPDATE tasks SET assignee_id = NULL WHERE team_id = $1 AND assignee_id = $2', [
    teamId,
    targetId,
  ]);
}

module.exports = {
  getRole,
  requireMember,
  list,
  create,
  details,
  update,
  remove,
  addMember,
  invite,
  removeMember,
};
