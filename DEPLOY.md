# Deploy to Google Cloud (Cloud Run + Cloud SQL)

One container serves the API and the built React app, so you get a single public URL.
Replace the values in CAPS. Run these in a terminal (or Google Cloud Shell, which already has `gcloud`).

## 1. Set up the project

```bash
gcloud auth login
gcloud projects create YOUR_PROJECT_ID          # or use an existing project
gcloud config set project YOUR_PROJECT_ID
# Link a billing account in the Cloud Console (required for Cloud SQL / Cloud Run)

gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 2. Create the PostgreSQL database (Cloud SQL)

```bash
gcloud sql instances create taskmanager-db \
  --database-version=POSTGRES_15 \
  --edition=ENTERPRISE \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql databases create taskmanager --instance=taskmanager-db
gcloud sql users create appuser --instance=taskmanager-db --password=CHOOSE_A_STRONG_PASSWORD
```

This takes a few minutes. Tables and the session table are created automatically on first start.

## 3. Deploy to Cloud Run

From the repository root (where the `Dockerfile` is):

```bash
gcloud run deploy task-manager \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:taskmanager-db \
  --set-env-vars NODE_ENV=production,DB_HOST=/cloudsql/YOUR_PROJECT_ID:us-central1:taskmanager-db,DB_NAME=taskmanager,DB_USER=appuser,DB_PASSWORD=CHOOSE_A_STRONG_PASSWORD,SESSION_SECRET=LONG_RANDOM_STRING
```

Generate a session secret with `openssl rand -hex 32`.
When it finishes, `gcloud` prints the **Service URL** (https://task-manager-xxxx.a.run.app). That is your deployed link.

If the first deploy asks to create an Artifact Registry repository, answer `Y`.

To update later, run the same `gcloud run deploy ... --source .` command again.

## 4. Troubleshooting

- **View logs:** `gcloud run services logs read task-manager --region us-central1`
- **"Failed to start" / database error:** check `DB_HOST` matches the instance connection name, and that `--add-cloudsql-instances` was set.
- **Login works but you get logged out:** make sure `NODE_ENV=production` is set (the app trusts the Cloud Run proxy and uses secure cookies).

## 5. GitHub (show branching and PR history)

Create an empty repo on GitHub first (e.g. `team-task-manager`), then:

```bash
git init
git branch -M main
git add .gitignore README.md DEPLOY.md Dockerfile .dockerignore
git commit -m "chore: project setup and docs"
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main

# Backend feature branch + PR
git checkout -b feature/backend-api
git add server
git commit -m "feat(server): auth, teams and tasks API with validation"
git push -u origin feature/backend-api
gh pr create --base main --title "Backend API" --body "Express API, Passport sessions, Joi validation" 
gh pr merge --merge

# Frontend feature branch + PR
git checkout main && git pull
git checkout -b feature/frontend-ui
git add client
git commit -m "feat(client): dashboard, task modal, search and filters"
git push -u origin feature/frontend-ui
gh pr create --base main --title "Frontend UI" --body "React + Tailwind dashboard"
gh pr merge --merge
git checkout main && git pull
```

(`gh` is the GitHub CLI; you can also open the pull requests on github.com.)

## 6. Submit

Message the recruiter on Indeed with:
- Deployed link (Cloud Run Service URL)
- GitHub repository link
