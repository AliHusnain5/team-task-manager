# Team Task Manager

A full stack web app where users register, create teams, add members, and create, assign and manage tasks inside those teams.

- **Live app:** https://team-task-manager.fly.dev
- **Source code:** https://github.com/AliHusnain5/team-task-manager

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL (also stores login sessions) |
| Authentication | PassportJS (local strategy) + express-session, bcrypt |
| Validation | Joi |
| Deployment | Docker (one container serves the API and the built frontend) |

## Features

**Core**
- Register and log in securely (sessions stored in PostgreSQL, HTTP-only cookies)
- Create teams, add and remove members by email
- Create, assign, update and delete tasks inside a team
- Dashboard with a team list and a task board (To do / In progress / Done)
- Search tasks and filter them by team, assignee or status
- Task create/update in a modal form
- Responsive layout: the header and teams sidebar stay fixed and only the task area scrolls; on phones the sidebar becomes a slide-in menu

**Bonus**
- Due date reminders: a banner shows your tasks that are overdue or due within 2 days
- Role-based access: only the team owner can edit or delete the team and manage members; only the task creator or the team owner can delete a task
- Invite members by email (stubbed: the invite is logged, no SMTP needed)

## Project structure

```
team-task-manager/
├── client/                         React + Tailwind + Vite
│   └── src/
│       ├── api/                    fetch wrapper, API calls, dev-only demo data
│       ├── components/
│       │   ├── layout/             Header, Sidebar
│       │   ├── tasks/              TaskBoard, TaskCard, TaskFilters, TaskModal, ReminderBanner
│       │   ├── teams/              TeamHeader, TeamModal, MembersModal
│       │   └── ui/                 Modal
│       ├── context/                AuthContext (current user, login/logout)
│       ├── hooks/                  useDashboard (data loading and actions)
│       ├── pages/                  AuthPage, DashboardPage
│       ├── utils/                  date helpers
│       └── constants.js
├── server/                         Express API
│   ├── src/
│   │   ├── config/                 reads environment variables in one place
│   │   ├── db/                     pool.js, init.js, schema.sql
│   │   ├── routes/                 URL to controller mapping (auth, teams, tasks)
│   │   ├── controllers/            read the request, call a service, send the response
│   │   ├── services/               business rules and SQL queries
│   │   ├── middleware/             auth guard, Joi validation, rate limit, error handler
│   │   ├── validators/             Joi schemas
│   │   ├── auth/                   Passport local strategy
│   │   ├── utils/                  asyncHandler, HttpError
│   │   ├── app.js                  builds the Express app (also used by the tests)
│   │   └── server.js               connects the database and starts listening
│   └── tests/                      API integration tests
├── Dockerfile                      single container: API + built frontend
├── netlify.toml                    optional: Netlify build + /api proxy
├── DEPLOY.md                       optional: Google Cloud (Cloud SQL + Cloud Run)
└── DEPLOY-RAILWAY-NETLIFY.md       optional: Railway + Netlify
```

Request flow on the server: `route -> middleware (auth, validation) -> controller -> service -> PostgreSQL`.

## Getting started (local)

**Requirements:** Node.js 18 or newer and a PostgreSQL database (local, or a hosted one such as Neon or Railway).

```bash
git clone https://github.com/AliHusnain5/team-task-manager.git
cd team-task-manager
```

**1. Backend**

```bash
cd server
cp .env.example .env        # on Windows PowerShell: copy .env.example .env
# edit .env: set DATABASE_URL and SESSION_SECRET (see "Environment variables")
npm install
npm run dev                 # http://localhost:8080
```

The tables (and the session table) are created automatically on the first start.

**2. Frontend** (in a second terminal)

```bash
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api to the backend on port 8080)
```

Open http://localhost:5173, register two users in different browsers, create a team, add the second user by email, and create and assign tasks.

**Preview the UI without a backend:** run `npm run dev` in `client` and open http://localhost:5173/?demo=1. It uses in-memory sample data and only works in development (it is not part of the production build).

## Environment variables (server)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes* | PostgreSQL connection string, e.g. `postgres://user:pass@host:5432/dbname` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | yes* | Alternative to `DATABASE_URL` (on Cloud Run use `DB_HOST=/cloudsql/PROJECT:REGION:INSTANCE`) |
| `DB_SSL` | no | Set to `true` if the database host requires SSL (hosted databases usually do) |
| `SESSION_SECRET` | yes in production | Long random string used to sign the session cookie |
| `NODE_ENV` | no | `production` enables secure cookies and the proxy trust setting |
| `PORT` | no | Port to listen on (default `8080`) |
| `SESSION_STORE` | no | Set to `memory` to keep sessions in memory instead of PostgreSQL (development only) |
| `AUTH_RATE_LIMIT_MAX` | no | Max login/register attempts per IP per 15 minutes (default `100`) |
| `TRUST_PROXY` | no | Number of reverse proxies in front of the app (default `1`) |
| `TEST_DATABASE_URL` | tests only | A database that the tests are allowed to wipe |

\* Provide either `DATABASE_URL` or the `DB_*` values.

## API overview

All routes except `/api/auth/register`, `/api/auth/login` and `/api/health` require a logged-in session.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account (and log in) |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Current user |
| GET / POST | `/api/teams` | List my teams / create a team |
| GET / PUT / DELETE | `/api/teams/:id` | Team details with members / update / delete (owner) |
| POST | `/api/teams/:id/members` | Add a member by email (owner) |
| POST | `/api/teams/:id/invite` | Invite by email, stubbed (owner) |
| DELETE | `/api/teams/:id/members/:userId` | Remove a member (owner) or leave the team (yourself) |
| GET | `/api/tasks?teamId=&assigneeId=&status=&q=` | List, filter and search tasks (`assigneeId` can be a user id, `me` or `unassigned`) |
| GET | `/api/tasks/reminders` | My tasks that are overdue or due within 2 days |
| POST | `/api/tasks` | Create a task |
| GET / PUT / DELETE | `/api/tasks/:id` | Get / update / delete a task |
| GET | `/api/health` | Health check |

## Database

Four tables plus the session table, created from `server/src/db/schema.sql`:

- `users`: id, name, email (unique), password_hash
- `teams`: id, name, description, created_by
- `team_members`: team_id, user_id, role (`owner` or `member`)
- `tasks`: id, team_id, title, description, status, priority, due_date, assignee_id, created_by
- `user_sessions`: created automatically by `connect-pg-simple`

Deleting a team removes its memberships and tasks (`ON DELETE CASCADE`). Removing a member unassigns their tasks in that team.

## Tests

```bash
cd server
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/taskmanager_test npm test
```

On Windows PowerShell:

```powershell
$env:TEST_DATABASE_URL="postgres://user:pass@localhost:5432/taskmanager_test"; npm test
```

The tests wipe the database they point to, so use a separate test database. Without `TEST_DATABASE_URL` they are skipped. They cover registration and login, validation, permissions (owner/member/non-member), task CRUD, filters and search, reminders, and logout.

## Docker

```bash
docker build -t team-task-manager .
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgres://user:pass@host:5432/taskmanager \
  -e DB_SSL=true \
  -e SESSION_SECRET=replace-with-a-long-random-string \
  team-task-manager
```

The container builds the React app and serves it together with the API on port 8080, so there is a single URL for the whole app.

## Deployment

The live app runs on **Fly.io** from the `Dockerfile`, with a **Neon** PostgreSQL database. Because the frontend and the API share one origin, no CORS or cross-site cookie setup is needed.

Steps used:

1. Create the app on Fly.io from the GitHub repository (it builds the root `Dockerfile`).
2. Set the environment variables: `NODE_ENV=production`, `SESSION_SECRET`, `DATABASE_URL` (the Neon connection string), `DB_SSL=true`.
3. Assign public IP addresses to the app (a shared IPv4 and an IPv6 address); without them the `*.fly.dev` hostname does not resolve.
4. Check `https://<app>.fly.dev/api/health`, which should return `{"status":"ok"}`.

Other options are documented in the repository: [DEPLOY.md](./DEPLOY.md) (Google Cloud: Cloud SQL + Cloud Run) and [DEPLOY-RAILWAY-NETLIFY.md](./DEPLOY-RAILWAY-NETLIFY.md) (Railway backend + Netlify frontend).

## Security

- Passwords are hashed with bcrypt (cost 12) and are never stored or returned in plain text
- The session cookie is HTTP-only, `SameSite=Lax`, and `Secure` in production
- Auth middleware protects every non-auth route; users only ever see teams and tasks they belong to
- Rate limiting on login and register
- All request bodies are validated and trimmed with Joi, and unknown fields are stripped
- All SQL uses parameterized queries
- Login errors do not reveal whether an email exists
- Security headers via helmet

## Design notes and assumptions

- A user who creates a team becomes its owner. Other members are added by email and must already be registered.
- A task can only be assigned to a member of the same team.
- Team members can see and update every task in their team; only the task creator or the owner can delete a task.
- Sessions are stored in PostgreSQL so they survive restarts and work across multiple instances.
- Email invites are intentionally stubbed (logged only), as no SMTP is required for this project.

## Possible improvements

- Database migrations with a migration tool instead of a single schema file
- Real email delivery for invites
- Task comments, attachments and activity history
- Frontend tests and a CI pipeline that runs the API tests on every pull request
