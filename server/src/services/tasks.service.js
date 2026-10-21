const pool = require('../db/pool');
const HttpError = require('../utils/httpError');
const teams = require('./teams.service');

const STATUSES = ['todo', 'in_progress', 'done'];

const TASK_SELECT = `
  SELECT t.id, t.team_id AS "teamId", tm.name AS "teamName", t.title, t.description,
         t.status, t.priority, to_char(t.due_date, 'YYYY-MM-DD') AS "dueDate",
         t.assignee_id AS "assigneeId", a.name AS "assigneeName",
         t.created_by AS "createdBy", c.name AS "createdByName",
         t.created_at AS "createdAt", t.updated_at AS "updatedAt"
    FROM tasks t
    JOIN teams tm ON tm.id = t.team_id
    LEFT JOIN users a ON a.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.created_by`;

// Only tasks from teams the user belongs to are ever visible.
const MEMBER_OF = 't.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1)';

async function fetchTask(id) {
  const { rows } = await pool.query(`${TASK_SELECT} WHERE t.id = $1`, [id]);
  return rows[0] || null;
}

// A task the user cannot see is reported as "not found".
async function getVisibleTask(id, userId) {
  const task = await fetchTask(id);
  const role = task ? await teams.getRole(task.teamId, userId) : null;
  if (!role) throw new HttpError(404, 'Task not found');
  return { task, role };
}

// Filters: teamId, assigneeId (id | 'me' | 'unassigned'), status, q (search text)
async function list(userId, query) {
  const params = [userId];
  const where = [MEMBER_OF];

  if (query.teamId) {
    const teamId = Number(query.teamId);
    if (!Number.isInteger(teamId)) throw new HttpError(400, 'Invalid teamId');
    params.push(teamId);
    where.push(`t.team_id = $${params.length}`);
  }
  if (query.assigneeId) {
    if (query.assigneeId === 'unassigned') {
      where.push('t.assignee_id IS NULL');
    } else {
      const assignee = query.assigneeId === 'me' ? userId : Number(query.assigneeId);
      if (!Number.isInteger(assignee)) throw new HttpError(400, 'Invalid assigneeId');
      params.push(assignee);
      where.push(`t.assignee_id = $${params.length}`);
    }
  }
  if (query.status) {
    if (!STATUSES.includes(query.status)) throw new HttpError(400, 'Invalid status');
    params.push(query.status);
    where.push(`t.status = $${params.length}`);
  }
  if (query.q && String(query.q).trim()) {
    params.push(`%${String(query.q).trim().slice(0, 100)}%`);
    where.push(`(t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
  }

  const { rows } = await pool.query(
    `${TASK_SELECT} WHERE ${where.join(' AND ')}
     ORDER BY t.due_date NULLS LAST, t.created_at DESC`,
    params
  );
  return rows;
}

// Bonus: my open tasks that are overdue or due within 2 days.
async function reminders(userId) {
  const { rows } = await pool.query(
    `${TASK_SELECT}
      WHERE t.assignee_id = $1 AND t.status <> 'done' AND t.due_date IS NOT NULL
        AND t.due_date <= CURRENT_DATE + 2
      ORDER BY t.due_date`,
    [userId]
  );
  return rows;
}

async function create(userId, body) {
  if (!(await teams.getRole(body.teamId, userId))) {
    throw new HttpError(403, 'You are not a member of this team');
  }
  if (body.assigneeId && !(await teams.getRole(body.teamId, body.assigneeId))) {
    throw new HttpError(400, 'Assignee must be a member of the team');
  }
  const { rows } = await pool.query(
    `INSERT INTO tasks (team_id, title, description, status, priority, due_date, assignee_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      body.teamId,
      body.title,
      body.description,
      body.status,
      body.priority,
      body.dueDate || null,
      body.assigneeId,
      userId,
    ]
  );
  return fetchTask(rows[0].id);
}

async function get(id, userId) {
  return (await getVisibleTask(id, userId)).task;
}

const UPDATABLE = {
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  dueDate: 'due_date',
  assigneeId: 'assignee_id',
};

async function update(id, userId, body) {
  const { task } = await getVisibleTask(id, userId);
  if (body.assigneeId && !(await teams.getRole(task.teamId, body.assigneeId))) {
    throw new HttpError(400, 'Assignee must be a member of the team');
  }
  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(UPDATABLE)) {
    if (body[key] !== undefined) {
      params.push(key === 'dueDate' ? body[key] || null : body[key]);
      sets.push(`${column} = $${params.length}`);
    }
  }
  params.push(id);
  await pool.query(
    `UPDATE tasks SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
    params
  );
  return fetchTask(id);
}

// Only the task creator or the team owner can delete.
async function remove(id, userId) {
  const { task, role } = await getVisibleTask(id, userId);
  if (role !== 'owner' && task.createdBy !== userId) {
    throw new HttpError(403, 'Only the task creator or team owner can delete this task');
  }
  await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
}

module.exports = { list, reminders, create, get, update, remove };
