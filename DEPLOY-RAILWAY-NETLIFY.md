# Deploy: Railway (database + backend) and Netlify (frontend)

Order matters: database, then backend, then frontend.

## 1. Railway: PostgreSQL
1. Railway dashboard > New Project > **Provision PostgreSQL**.
2. Keep it in the same project as the backend service (next step), so they can talk over the private network.

## 2. Railway: backend
1. In the same project: **New > GitHub Repo** and pick your repository.
2. Open the new service > **Settings**:
   - **Root Directory:** `server`
   - **Start Command:** `npm start`
3. Open **Variables** and add:
   | Name | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `SESSION_SECRET` | a long random string (`openssl rand -hex 32`) |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (use the "Add Reference" button and pick your Postgres service) |
   | `DB_SSL` | `true` only if you use the *public* database URL and get an SSL error; skip it for the private one |
4. **Settings > Networking > Generate Domain.** Copy the URL, e.g. `https://team-task-backend.up.railway.app`.
5. Check it works: open `https://YOUR-BACKEND.up.railway.app/api/health`. You should see `{"status":"ok"}`.

Tables (and the session table) are created automatically on first start.

## 3. Netlify: frontend
1. Edit `netlify.toml` in the repo root and replace `https://YOUR-BACKEND.up.railway.app` with your real Railway URL. Commit and push.
2. Netlify > **Add new site > Import from Git** and pick the repository.
3. The build settings come from `netlify.toml` (base `client`, command `npm run build`, publish `dist`). Click **Deploy**.
4. Open the Netlify URL, register a user and test.

No CORS settings are needed: Netlify proxies `/api/*` to Railway, so the browser sees one domain and the session cookie works normally.

## Troubleshooting
- **Register/login fails or "Not found":** the Railway URL in `netlify.toml` is wrong or not pushed. Redeploy Netlify after fixing it.
- **Logged out after every refresh:** make sure `NODE_ENV=production` is set on Railway.
- **Backend crashes at start:** open Railway > Deployments > Logs. Usually `DATABASE_URL` is missing or `SESSION_SECRET` is not set.
- **SSL error from the database:** add `DB_SSL=true`.

## Assessment note
The assessment asks for the deployed version and the database to be on **Google Cloud Platform**. Railway and Netlify are not GCP. If you submit this setup, tell the recruiter or get approval first. The GCP steps are still in `DEPLOY.md`.
