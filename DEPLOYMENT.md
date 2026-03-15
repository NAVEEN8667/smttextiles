# Deployment Guide

This repo is prepared for this hosting setup:

- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL
- Source control: GitHub

## 1. What was already prepared in this repo

The codebase now includes:

- frontend API requests driven by Vite environment config
- backend PostgreSQL support through DATABASE_URL for Neon
- stricter production CORS support through FRONTEND_URL and CORS_ORIGINS
- Neon-ready schema file at server/database/schema.neon.sql
- example environment files at client/.env.example and server/.env.example
- Render config at render.yaml
- Vercel config at client/vercel.json

## 2. Frontend environment variables

Set this in Vercel:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

For local development:

```env
VITE_API_URL=http://localhost:5000/api
```

## 3. Backend environment variables

Set these in Render:

```env
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=https://your-vercel-project.vercel.app
CORS_ORIGINS=https://your-vercel-project.vercel.app
RAZORPAY_KEY_ID=replace_with_razorpay_key_id
RAZORPAY_KEY_SECRET=replace_with_razorpay_key_secret
EMAIL_USER=replace_with_email@example.com
EMAIL_PASS=replace_with_email_app_password
```

Optional local-only variables if you are not using Neon locally:

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=textile_db
```

## 4. Create the Neon database

1. Sign in to Neon.
2. Create a project.
3. Open the project dashboard.
4. Copy the PostgreSQL connection string.
5. Use that value as DATABASE_URL in Render.

The connection string looks like this:

```env
postgresql://username:password@ep-xxxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 5. Create the schema in Neon

You can use either method below.

### Option A: Neon SQL editor

Open the SQL editor in Neon and run the contents of server/database/schema.neon.sql.

### Option B: Local command line

From the repo root run:

```powershell
psql "postgresql://username:password@hostname/database?sslmode=require" -f server/database/schema.neon.sql
```

You can also initialize through the Node script after setting server/.env with DATABASE_URL:

```powershell
cd server
npm install
npm run db:init
```

## 6. Push the project to GitHub

From the repo root:

```powershell
git init
git add .
git commit -m "Prepare app for cloud deployment"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

If the repo already exists remotely:

```powershell
git add .
git commit -m "Prepare app for cloud deployment"
git push origin main
```

## 7. Deploy the backend to Render

1. Sign in to Render.
2. Create a new Web Service.
3. Connect your GitHub repo.
4. Select this repository.
5. Use these settings:

- Root Directory: server
- Environment: Node
- Build Command: npm install
- Start Command: npm start

Render can also read render.yaml from the repo root.

Add environment variables in Render:

- DATABASE_URL
- JWT_SECRET
- FRONTEND_URL
- CORS_ORIGINS
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- EMAIL_USER
- EMAIL_PASS

After deploy, test the health endpoint:

```text
https://your-render-service.onrender.com/
```

It should return the API running message.

## 8. Deploy the frontend to Vercel

1. Sign in to Vercel.
2. Import the GitHub repository.
3. Set the root directory to client.
4. Confirm the Vite build settings.

Expected settings:

- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist

Set this environment variable in Vercel:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

## 9. Connect frontend to backend after deploy

This repo now reads the frontend API base from VITE_API_URL.

That means the deployed frontend will call:

```text
https://your-render-service.onrender.com/api
```

After Vercel gives you the production URL, copy it into Render:

```env
FRONTEND_URL=https://your-vercel-project.vercel.app
CORS_ORIGINS=https://your-vercel-project.vercel.app
```

Then redeploy the Render service.

## 10. Useful scripts

Backend scripts:

```powershell
cd server
npm install
npm run db:init
npm run db:check-schema
npm run db:test
npm run migrate:v2
npm run migrate:enhancements
npm run migrate:new-modules
npm run migrate:order-id
```

Frontend scripts:

```powershell
cd client
npm install
npm run build
npm run preview
```

## 11. Recommended deployment order

1. Create Neon database.
2. Import server/database/schema.neon.sql.
3. Push repo to GitHub.
4. Deploy backend to Render.
5. Add backend environment variables.
6. Deploy frontend to Vercel.
7. Add VITE_API_URL in Vercel.
8. Copy the Vercel URL into FRONTEND_URL and CORS_ORIGINS in Render.
9. Redeploy Render.
10. Test login, products, cart, checkout, profile, and contact form.

## 12. Manual steps that still require your accounts

These steps cannot be completed from this local workspace:

- creating the Neon project
- creating the Render service
- creating the Vercel project
- connecting GitHub to Render and Vercel
- entering real secrets and service URLs into Render and Vercel
