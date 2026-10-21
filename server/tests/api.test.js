// Integration tests. They need a PostgreSQL database that can be WIPED:
//   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/taskmanager_test npm test
// Without TEST_DATABASE_URL the suite is skipped (so it can never touch a real database).
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const skip = !process.env.TEST_DATABASE_URL && 'TEST_DATABASE_URL is not set';

describe('Team Task Manager API', { skip }, () => {
  let request, pool, app;
  let alice, bob; // supertest agents keep their own session cookie
  let teamId, taskId, bobId;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.SESSION_STORE = 'memory';
    process.env.AUTH_RATE_LIMIT_MAX = '1000';

    request = require('supertest');
    app = require('../src/app');
    pool = require('../src/db/pool');
    await require('../src/db/init').initDb();
    await pool.query('TRUNCATE users, teams, team_members, tasks RESTART IDENTITY CASCADE');

    alice = request.agent(app);
    bob = request.agent(app);
  });

  after(async () => {
    if (pool) await pool.end();
  });

  describe('authentication', () => {
    it('blocks protected routes when logged out', async () => {
      await request(app).get('/api/teams').expect(401);
      await request(app).get('/api/tasks').expect(401);
    });

    it('rejects invalid registration input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'A', email: 'nope', password: '123' })
        .expect(400);
      assert.equal(res.body.message, 'Validation failed');
    });

    it('registers, logs in automatically and returns the current user', async () => {
      await alice
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'Alice@Example.com', password: 'password123' })
        .expect(201);
      const me = await alice.get('/api/auth/me').expect(200);
      assert.equal(me.body.user.email, 'alice@example.com');

      const res = await bob
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'bob@example.com', password: 'password123' })
        .expect(201);
      bobId = res.body.user.id;
    });

    it('stores a bcrypt hash, never the plain password', async () => {
      const { rows } = await pool.query("SELECT password_hash FROM users WHERE email = 'alice@example.com'");
      assert.match(rows[0].password_hash, /^\$2[aby]\$12\$/);
    });

    it('rejects duplicate emails and wrong passwords', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice 2', email: 'alice@example.com', password: 'password123' })
        .expect(409);
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'wrong-password' })
        .expect(401);
    });

    it('sets an HTTP-only session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'password123' })
        .expect(200);
      assert.match(res.headers['set-cookie'][0], /HttpOnly/i);
    });
  });

  describe('teams', () => {
    it('creates a team and makes the creator the owner', async () => {
      const res = await alice.post('/api/teams').send({ name: 'Alpha', description: 'first' }).expect(201);
      teamId = res.body.team.id;
      assert.equal(res.body.team.role, 'owner');
    });

    it('hides the team from non-members', async () => {
      await bob.get(`/api/teams/${teamId}`).expect(404);
      const list = await bob.get('/api/teams').expect(200);
      assert.equal(list.body.teams.length, 0);
    });

    it('lets only the owner add members', async () => {
      await bob.post(`/api/teams/${teamId}/members`).send({ email: 'bob@example.com' }).expect(404);
      await alice.post(`/api/teams/${teamId}/members`).send({ email: 'bob@example.com' }).expect(201);
      await alice.post(`/api/teams/${teamId}/members`).send({ email: 'bob@example.com' }).expect(409);
      await alice.post(`/api/teams/${teamId}/members`).send({ email: 'ghost@example.com' }).expect(404);
    });

    it('stubs email invites', async () => {
      const res = await alice
        .post(`/api/teams/${teamId}/invite`)
        .send({ email: 'ghost@example.com' })
        .expect(202);
      assert.match(res.body.message, /stubbed/);
    });

    it('does not let a member delete the team', async () => {
      await bob.delete(`/api/teams/${teamId}`).expect(403);
    });
  });

  describe('tasks', () => {
    it('creates a task assigned to a team member', async () => {
      const res = await alice
        .post('/api/tasks')
        .send({ teamId, title: 'Write docs', priority: 'high', dueDate: '2020-01-01', assigneeId: bobId })
        .expect(201);
      taskId = res.body.task.id;
      assert.equal(res.body.task.assigneeName, 'Bob');
      assert.equal(res.body.task.dueDate, '2020-01-01');
    });

    it('rejects an assignee who is not in the team', async () => {
      await alice.post('/api/tasks').send({ teamId, title: 'x', assigneeId: 999 }).expect(400);
    });

    it('lets a team member update a task', async () => {
      const res = await bob.put(`/api/tasks/${taskId}`).send({ status: 'in_progress' }).expect(200);
      assert.equal(res.body.task.status, 'in_progress');
      await alice.put(`/api/tasks/${taskId}`).send({}).expect(400);
    });

    it('filters by team, assignee, status and search text', async () => {
      const count = async (agent, query) => (await agent.get(`/api/tasks${query}`).expect(200)).body.tasks.length;
      assert.equal(await count(bob, '?assigneeId=me'), 1);
      assert.equal(await count(alice, '?assigneeId=me'), 0);
      assert.equal(await count(alice, `?teamId=${teamId}&q=docs`), 1);
      assert.equal(await count(alice, '?q=zzz'), 0);
      assert.equal(await count(alice, '?status=done'), 0);
      assert.equal(await count(alice, "?q=%27%3B%20DROP%20TABLE%20tasks%3B--"), 0); // SQL injection attempt is harmless
    });

    it('returns overdue tasks as reminders for the assignee only', async () => {
      const mine = await bob.get('/api/tasks/reminders').expect(200);
      assert.equal(mine.body.tasks.length, 1);
      const theirs = await alice.get('/api/tasks/reminders').expect(200);
      assert.equal(theirs.body.tasks.length, 0);
    });

    it('lets only the creator or team owner delete a task', async () => {
      await bob.delete(`/api/tasks/${taskId}`).expect(403);
      await alice.delete(`/api/tasks/${taskId}`).expect(200);
      await alice.get(`/api/tasks/${taskId}`).expect(404);
    });
  });

  describe('logout', () => {
    it('ends the session', async () => {
      await alice.post('/api/auth/logout').expect(200);
      await alice.get('/api/auth/me').expect(401);
    });
  });
});
