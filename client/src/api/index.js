import { request, qs } from './client.js';
import { demoApi } from './demo.js';

const realApi = {
  me: () => request('GET', '/api/auth/me'),
  register: (b) => request('POST', '/api/auth/register', b),
  login: (b) => request('POST', '/api/auth/login', b),
  logout: () => request('POST', '/api/auth/logout'),

  teams: () => request('GET', '/api/teams'),
  team: (id) => request('GET', `/api/teams/${id}`),
  createTeam: (b) => request('POST', '/api/teams', b),
  updateTeam: (id, b) => request('PUT', `/api/teams/${id}`, b),
  deleteTeam: (id) => request('DELETE', `/api/teams/${id}`),
  addMember: (id, email) => request('POST', `/api/teams/${id}/members`, { email }),
  inviteMember: (id, email) => request('POST', `/api/teams/${id}/invite`, { email }),
  removeMember: (id, userId) => request('DELETE', `/api/teams/${id}/members/${userId}`),

  tasks: (filters) => request('GET', `/api/tasks${qs(filters)}`),
  reminders: () => request('GET', '/api/tasks/reminders'),
  createTask: (b) => request('POST', '/api/tasks', b),
  updateTask: (id, b) => request('PUT', `/api/tasks/${id}`, b),
  deleteTask: (id) => request('DELETE', `/api/tasks/${id}`),
};

// Demo mode (UI preview without a backend): only in `npm run dev`, with ?demo=1 in the URL.
// import.meta.env.DEV is false in production builds, so this is never active when deployed.
const useDemo = import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo');

export const api = useDemo ? demoApi : realApi;
