// Demo mode: lets you look at the whole UI without a backend or database.
// Open http://localhost:5173/?demo=1 while running `npm run dev`.
// It is switched off in production builds (see api.js), data lives in memory only.

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
};

const me = { id: 1, name: 'Demo User', email: 'demo@example.com' };
const users = [
  me,
  { id: 2, name: 'Sara Khan', email: 'sara@example.com' },
  { id: 3, name: 'Ali Raza', email: 'ali@example.com' },
  { id: 4, name: 'Hira Noor', email: 'hira@example.com' },
];

let nextTeam = 3;
let nextTask = 9;

const teams = [
  { id: 1, name: 'Design Squad', description: 'Landing page and brand work', createdBy: 1 },
  { id: 2, name: 'Backend Crew', description: 'API and database tasks', createdBy: 2 },
];
const members = { 1: [1, 2, 3], 2: [2, 1] }; // first id = owner

const tasks = [
  { id: 1, teamId: 1, title: 'Draft landing page', description: 'Hero section, pricing and FAQ blocks.', status: 'in_progress', priority: 'high', dueDate: day(1), assigneeId: 1, createdBy: 1 },
  { id: 2, teamId: 1, title: 'Pick brand colors', description: 'Shortlist 3 palettes for review.', status: 'todo', priority: 'medium', dueDate: day(5), assigneeId: 2, createdBy: 1 },
  { id: 3, teamId: 1, title: 'Logo variations', description: '', status: 'todo', priority: 'low', dueDate: null, assigneeId: null, createdBy: 1 },
  { id: 4, teamId: 1, title: 'Export icon set', description: 'SVG and PNG at 2x.', status: 'done', priority: 'medium', dueDate: day(-3), assigneeId: 3, createdBy: 1 },
  { id: 5, teamId: 2, title: 'Add rate limiting', description: 'Protect login and register routes.', status: 'todo', priority: 'high', dueDate: day(-2), assigneeId: 1, createdBy: 2 },
  { id: 6, teamId: 2, title: 'Write API tests', description: 'Cover auth, teams and tasks.', status: 'in_progress', priority: 'medium', dueDate: day(7), assigneeId: 2, createdBy: 2 },
  { id: 7, teamId: 2, title: 'Set up database backups', description: '', status: 'done', priority: 'low', dueDate: null, assigneeId: 1, createdBy: 2 },
  { id: 8, teamId: 2, title: 'Review pull requests', description: 'Two open PRs waiting.', status: 'todo', priority: 'medium', dueDate: day(2), assigneeId: null, createdBy: 1 },
];

const userById = (id) => users.find((u) => u.id === id);
const teamById = (id) => teams.find((t) => t.id === Number(id));
const roleIn = (teamId, userId) => {
  const list = members[teamId] || [];
  if (!list.includes(userId)) return null;
  return list[0] === userId ? 'owner' : 'member';
};
const fail = (message) => Promise.reject(new Error(message));
const ok = (data) => Promise.resolve(structuredClone(data));

const shape = (t) => ({
  ...t,
  teamName: teamById(t.teamId)?.name,
  assigneeName: t.assigneeId ? userById(t.assigneeId)?.name : null,
  createdByName: userById(t.createdBy)?.name,
});

const teamShape = (t) => ({
  ...t,
  role: roleIn(t.id, me.id),
  memberCount: members[t.id].length,
});

export const demoApi = {
  me: () => ok({ user: me }),
  register: () => ok({ user: me }),
  login: () => ok({ user: me }),
  logout: () => ok({ message: 'Logged out' }),

  teams: () => ok({ teams: teams.filter((t) => roleIn(t.id, me.id)).map(teamShape) }),
  team: (id) => {
    const t = teamById(id);
    if (!t) return fail('Team not found');
    return ok({
      team: teamShape(t),
      members: members[t.id].map((uid, i) => ({ ...userById(uid), role: i === 0 ? 'owner' : 'member' })),
    });
  },
  createTeam: (b) => {
    const t = { id: nextTeam++, name: b.name, description: b.description || '', createdBy: me.id };
    teams.unshift(t);
    members[t.id] = [me.id];
    return ok({ team: teamShape(t) });
  },
  updateTeam: (id, b) => {
    Object.assign(teamById(id), { name: b.name, description: b.description || '' });
    return ok({ team: teamShape(teamById(id)) });
  },
  deleteTeam: (id) => {
    teams.splice(teams.findIndex((t) => t.id === Number(id)), 1);
    for (let i = tasks.length - 1; i >= 0; i--) if (tasks[i].teamId === Number(id)) tasks.splice(i, 1);
    return ok({ message: 'Team deleted' });
  },
  addMember: (id, email) => {
    const u = users.find((x) => x.email === email.toLowerCase());
    if (!u) return fail('No registered user with that email. Try sending an invite.');
    if (members[id].includes(u.id)) return fail('User is already a member of this team');
    members[id].push(u.id);
    return ok({ member: { ...u, role: 'member' } });
  },
  inviteMember: (id, email) => ok({ message: `Invite to ${email} queued (stubbed, no email is actually sent).` }),
  removeMember: (id, userId) => {
    members[id] = members[id].filter((u) => u !== Number(userId));
    tasks.forEach((t) => { if (t.teamId === Number(id) && t.assigneeId === Number(userId)) t.assigneeId = null; });
    return ok({ message: 'Member removed' });
  },

  tasks: (f = {}) => {
    const q = (f.q || '').toLowerCase();
    const list = tasks.filter((t) => {
      if (!roleIn(t.teamId, me.id)) return false;
      if (f.teamId && t.teamId !== Number(f.teamId)) return false;
      if (f.status && t.status !== f.status) return false;
      if (f.assigneeId === 'unassigned' && t.assigneeId) return false;
      if (f.assigneeId === 'me' && t.assigneeId !== me.id) return false;
      if (f.assigneeId && !['me', 'unassigned'].includes(f.assigneeId) && t.assigneeId !== Number(f.assigneeId)) return false;
      if (q && !`${t.title} ${t.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return ok({ tasks: list.map(shape) });
  },
  reminders: () =>
    ok({
      tasks: tasks
        .filter((t) => t.assigneeId === me.id && t.status !== 'done' && t.dueDate && t.dueDate <= day(2))
        .map(shape),
    }),
  createTask: (b) => {
    const t = {
      id: nextTask++, teamId: b.teamId, title: b.title, description: b.description || '',
      status: b.status, priority: b.priority, dueDate: b.dueDate || null,
      assigneeId: b.assigneeId || null, createdBy: me.id,
    };
    tasks.unshift(t);
    return ok({ task: shape(t) });
  },
  updateTask: (id, b) => {
    const t = tasks.find((x) => x.id === Number(id));
    Object.assign(t, b);
    return ok({ task: shape(t) });
  },
  deleteTask: (id) => {
    tasks.splice(tasks.findIndex((t) => t.id === Number(id)), 1);
    return ok({ message: 'Task deleted' });
  },
};
