# Team Task Manager

A full stack web app where users register, create teams, add members, and create/assign/manage tasks inside teams.

**Stack:** React + Vite + Tailwind CSS (frontend), Node.js + Express (backend), PostgreSQL (database, also stores sessions), PassportJS + express-session (auth), Joi (validation), bcrypt (password hashing).

## Features

- Secure register / login / logout (sessions in PostgreSQL, HTTP-only cookies)
- Create teams, add/remove members by email (team owner only)
- Create, assign, update, delete tasks within a team
- Dashboard with team list and a task board (To do / In progress / Done)
- Search tasks and filter by team, assignee, or status
- Task create/update modal
- Fully responsive: the header and teams sidebar stay fixed and only the task area scrolls; on phones the sidebar becomes a slide-in menu
- Bonus: role-based access (only the team owner can edit/delete the team or manage members; only members can see or change a team's tasks; only the task creator or team owner can delete a task)
- Bonus: due date reminders banner for tasks assigned to you (due within 2 days or overdue)
- Bonus: invite by email (stubbed: logs the invite, no SMTP needed)

## Project structure

```
team-task-manager/
├── client/                         React + Tailwind + Vite
│   └── src/
│       ├── api/                    client.js (fetch wrapper), index.js (API calls), demo.js (dev-only preview data)
│       ├── components/
│       │   ├── layout/             Header, Sidebar
│       │   ├── tasks/              TaskBoard, TaskCard, TaskFilters, TaskModal, ReminderBanner
│       │   ├── teams/              TeamHeader, TeamModal, MembersModal
│       │   └── ui/                 Modal
│       ├── context/                AuthContext (current user, login/logout)
│       ├── hooks/                  useDashboard (data loading + actions)
│       ├── pages/                  AuthPage, DashboardPage
│       ├── utils/                  date helpers
│       └── constants.js
├── server/                         Express API
│   ├── src/
│   │   ├── config/                 reads environment variables in one place
│   │   ├── db/                     pool.js, init.js, schema.sql
│   │   ├── routes/                 URL -> controller mapping (auth, teams, tasks)
│   │   ├── controllers/            read the request, call a service, send the response
│   │   ├── services/               business rules and SQL queries
│   │   ├── middleware/             auth guard, Joi validation, rate limit, error handler
│   │   ├── validators/             Joi schemas
│   │   ├── auth/                   Passport local strategy
│   │   ├── utils/                  asyncHandler, HttpError
│   │   ├── app.js                  builds the Express app (also used by tests)
│   │   └── server.js               connects the database and starts listening
│   └── tests/                      API integration tests
├── netlify.toml                    Netlify build + /api proxy (Railway/Netlify deploy)
├── Dockerfile                      single container (API + built frontend)
├── DEPLOY.md                       Google Cloud + GitHub steps
└── DEPLOY-RAILWAY-NETLIFY.md       Railway + Netlify steps
```

Request flow on the server: `route -> middleware (auth, validation) -> controller -> service -> PostgreSQL`.

## API overview

All routes except `/api/auth/register` and `/api/auth/login` require a logged-in session.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account (and log in) |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Current user |
| GET / POST | `/api/teams` | List my teams / create a team |
| GET / PUT / DELETE | `/api/teams/:id` | Team details / update / delete (owner) |
| POST | `/api/teams/:id/members` | Add member by email (owner) |
| POST | `/api/teams/:id/invite` | Invite by email, stubbed (owner) |
| DELETE | `/api/teams/:id/members/:userId` | Remove member (owner) or leave team (self) |
| GET | `/api/tasks?teamId=&assigneeId=&status=&q=` | List/filter/search tasks (`assigneeId` can be `me` or `unassigned`) |
| GET | `/api/tasks/reminders` | My tasks that are overdue or due within 2 days |
| POST | `/api/tasks` | Create task |
| PUT / DELETE | `/api/tasks/:id` | Update / delete task |
| GET | `/api/health` | Health check |

## Run locally

Requirements: Node.js 18+ and a PostgreSQL database (local, or a hosted one such as Railway).

1. Backend:
   ```bash
   cd server
   cp .env.example .env     # edit DATABASE_URL and SESSION_SECRET
   npm install
   npm run dev              # http://localhost:8080 (tables are created automatically)
   ```
2. Frontend (second terminal):
   ```bash
   cd client
   npm install
   npm run dev              # http://localhost:5173 (proxies /api to the backend)
   ```

Open http://localhost:5173, register two users in different browsers, create a team, add the second user by email, and create tasks.

**Preview the UI without a backend:** run `npm run dev` in `client` and open http://localhost:5173/?demo=1. It uses in-memory sample data and works only in development (it is not part of the production build).

## Tests

```bash
cd server
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/taskmanager_test npm test
```

The tests wipe the database they are pointed at, so use a separate test database. Without `TEST_DATABASE_URL` they are skipped.

## Run with Docker (production-like)

```bash
docker build -t team-task-manager .
docker run -p 8080:8080 \
  -e DATABASE_URL=postgres://user:pass@host:5432/taskmanager \
  -e SESSION_SECRET=$(openssl rand -hex 32) \
  team-task-manager
```

The container serves both the API and the built React app on port 8080.

## Deploy

- Google Cloud (Cloud SQL + Cloud Run): [DEPLOY.md](./DEPLOY.md)
- Railway (database + backend) and Netlify (frontend): [DEPLOY-RAILWAY-NETLIFY.md](./DEPLOY-RAILWAY-NETLIFY.md)

## Security notes

- Passwords hashed with bcrypt (cost 12), never stored or returned in plain text
- Session cookie is HTTP-only, `SameSite=Lax`, and `Secure` in production
- Auth middleware protects every non-auth route
- Rate limiting on login and register
- All request bodies validated and trimmed with Joi; unknown fields are stripped
- All SQL uses parameterized queries
- Login errors do not reveal whether an email exists
- Security headers via helmet
