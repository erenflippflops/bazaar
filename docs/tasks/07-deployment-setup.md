# Task 07: Deployment Setup (Render + Vercel)

**Date:** 30 September 2026  
**Manager:** ENI  
**Builder:** Fable 5.1, effort high  
**Priority:** HIGH (parallel with Tasks 05, 06)

---

## Builder

### Context
The game works locally. Now prepare it for deployment: backend on Render.com, frontend on Vercel. This task creates deployment configs and documentation, but does NOT perform the actual deploy (Eren will do that manually with his API key).

### Target Architecture

**Backend (Render.com):**
- Web Service (Node.js)
- Region: Oregon (us-west) or closest
- Auto-deploy from GitHub main branch
- Environment variables: PORT, ANTHROPIC_API_KEY, GAME_TIME_SCALE
- Health check endpoint: GET /health

**Frontend (Vercel):**
- Static site (Vite build)
- Auto-deploy from GitHub main branch
- Environment variable: VITE_SERVER_URL (backend WebSocket URL)
- Edge network (automatic)

**Communication:**
- Frontend connects to backend via WebSocket (wss://)
- Render provides HTTPS + WSS automatically
- CORS enabled on backend for Vercel domain

### Files You Will Create

```
BAZAAR/
├── render.yaml                   (NEW - Render blueprint)
├── DEPLOYMENT.md                 (NEW - deployment guide for Eren)
├── server/
│   └── main.ts                   (MODIFY - add PORT default, CORS)
├── client/
│   ├── .env.example              (NEW - template for env vars)
│   ├── .env.production           (NEW - empty, Eren fills)
│   └── src/
│       └── config.ts             (NEW - reads VITE_SERVER_URL)
└── .github/
    └── workflows/
        └── test.yml              (NEW - optional CI to run tests on push)
```

### Step 1: Backend Deployment Config

**render.yaml:**
```yaml
services:
  - type: web
    name: bazaar-server
    env: node
    region: oregon
    plan: free  # Eren can upgrade later
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: PORT
        value: 10000
      - key: GAME_TIME_SCALE
        value: 1
      - key: ANTHROPIC_API_KEY
        sync: false  # User must set manually in Render dashboard
    autoDeploy: true
    branch: main
```

**server/main.ts changes:**

Add CORS for frontend:
```typescript
import cors from 'cors';

// After creating server, before socket.io:
app.use(cors({
  origin: process.env.CLIENT_URL || '*',  // Eren sets CLIENT_URL to Vercel domain
  credentials: true
}));
```

Ensure PORT is read:
```typescript
const PORT = parseInt(process.env.PORT || '3000', 10);
```

**package.json scripts (if missing):**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server/main.js",
    "dev": "tsx server/main.ts"
  }
}
```

### Step 2: Frontend Deployment Config

**client/.env.example:**
```
VITE_SERVER_URL=ws://localhost:3000
```

**client/.env.production:**
```
# Eren fills this after deploying backend:
# VITE_SERVER_URL=wss://bazaar-server-xxxx.onrender.com
VITE_SERVER_URL=
```

**client/src/config.ts:**
```typescript
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3000';
```

**client/src/hooks/useSocket.ts changes:**
```typescript
import { SERVER_URL } from '../config';

// In useSocket:
const socket = io(SERVER_URL, {
  transports: ['websocket'],
  reconnection: true
});
```

**vercel.json (optional, for custom config):**
```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "devCommand": "cd client && npm run dev",
  "framework": "vite"
}
```

### Step 3: DEPLOYMENT.md Guide

Write a step-by-step guide for Eren (non-technical, very simple):

```markdown
# Deployment Guide

This guide shows how to deploy the Bazaar game to the internet so your friends can play.

## Prerequisites

1. GitHub account (you have this)
2. Render.com account (free) - sign up at https://render.com
3. Vercel account (free) - sign up at https://vercel.com
4. Anthropic API key (you have this)

## Part 1: Deploy Backend (Game Server) to Render

### Step 1: Connect GitHub to Render
1. Go to https://render.com/dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub account if not connected
4. Select the `bazaar` repository
5. Render will detect `render.yaml` automatically
6. Click "Apply"

### Step 2: Set Environment Variables
1. After blueprint creates the service, go to the service page
2. Click "Environment" tab
3. Find `ANTHROPIC_API_KEY`
4. Click "Edit" and paste your API key: `sk-ant-...`
5. Click "Save"

### Step 3: Wait for Deploy
1. Render will build and start your server (~5 minutes first time)
2. When status is "Live" (green), copy the URL
3. Example: `https://bazaar-server-xxxx.onrender.com`
4. Test: Open `https://bazaar-server-xxxx.onrender.com/health` in browser
5. Should see: `{"status":"ok"}`

## Part 2: Deploy Frontend (Game UI) to Vercel

### Step 1: Add Backend URL to Client
1. Open `client/.env.production` file on your computer
2. Add this line (replace with YOUR Render URL):
   ```
   VITE_SERVER_URL=wss://bazaar-server-xxxx.onrender.com
   ```
3. Save the file
4. Commit and push:
   ```bash
   git add client/.env.production
   git commit -m "Add production backend URL"
   git push origin main
   ```

### Step 2: Connect GitHub to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import `bazaar` repository
4. Vercel will detect Vite automatically
5. **IMPORTANT:** Set "Root Directory" to `client`
6. Click "Deploy"

### Step 3: Wait for Deploy
1. Vercel will build and deploy (~2 minutes)
2. When done, you'll get a URL: `https://bazaar-xxx.vercel.app`
3. Copy this URL

### Step 4: Allow Frontend in Backend CORS
1. Go back to Render dashboard
2. Open your bazaar-server service
3. Go to "Environment" tab
4. Add new environment variable:
   - Key: `CLIENT_URL`
   - Value: `https://bazaar-xxx.vercel.app` (your Vercel URL)
5. Save (this will redeploy server)

## Part 3: Test the Deployed Game

1. Open your Vercel URL in 2 browser tabs (or 2 devices)
2. Tab 1: Create a room
3. Tab 2: Join the room with the code
4. Start a game and play!

If it works: 🎉 Your game is live!

## Troubleshooting

**"Cannot connect to server":**
- Check `client/.env.production` has correct Render URL
- Check Render service is "Live" (not sleeping)
- Render free tier sleeps after 15min inactivity (wakes on first request, takes ~30s)

**"Judge failed" every time:**
- Check Anthropic API key is set in Render environment
- Check API key is valid and has credits

**"CORS error" in browser console:**
- Check `CLIENT_URL` is set in Render to your Vercel URL
- Make sure Vercel URL has NO trailing slash

## Updating the Game

Every time you push to `main` branch on GitHub:
- Render auto-deploys backend (~3 min)
- Vercel auto-deploys frontend (~2 min)

No manual steps needed!

## Costs

- Render free tier: 750 hours/month (enough for this project)
- Vercel free tier: unlimited hobby projects
- Anthropic API: ~$0.01 per game (Claude Haiku is cheap)

Expect ~$5-10/month if playing frequently.
```

### Step 4: Optional CI (GitHub Actions)

**`.github/workflows/test.yml`:**
```yaml
name: Run Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
        env:
          ANTHROPIC_API_KEY: test-key-not-real
```

This runs tests on every push (optional, nice to have).

### Constraints

- Do NOT actually deploy (no API keys available to you)
- Do NOT commit `.env.production` with real URLs (leave empty)
- Focus on CONFIG files and DOCUMENTATION
- Each major section is a separate commit
- Provide raw output (no "✓ done" summaries)

### Testing

You can't test the deploy itself, but verify:
1. `render.yaml` is valid YAML (use online validator)
2. `server/main.ts` reads PORT and has CORS
3. `client/src/config.ts` reads VITE_SERVER_URL
4. DEPLOYMENT.md is clear and step-by-step

### Expected Output

3 commits:
1. `Add Render deployment config (render.yaml, server CORS)`
2. `Add Vercel deployment config (env template, config.ts)`
3. `Add DEPLOYMENT.md guide and optional CI workflow`

---

## Audit

### Context
Builder prepared deployment configs for Render + Vercel. Your job: verify configs are correct, guide is clear.

### Setup
```bash
cd C:\Users\lolse\Projects\BAZAAR-audit
git pull
```

### Tasks

#### 1. Read Commits
```bash
git log --oneline -3
git diff HEAD~3..HEAD --stat
```

Verify 3 commits for deployment setup.

#### 2. Config Review

**render.yaml:**
- Is it valid YAML? (paste into https://www.yamllint.com/)
- Does it have healthCheckPath: /health?
- Are envVars present (PORT, GAME_TIME_SCALE, ANTHROPIC_API_KEY)?
- Is branch: main?

**server/main.ts:**
- Is CORS added?
- Is CLIENT_URL env var used for origin?
- Is PORT read from env?

**client config:**
- Is `.env.example` present?
- Is `config.ts` reading VITE_SERVER_URL?
- Is `useSocket.ts` using SERVER_URL from config?

**DEPLOYMENT.md:**
- Is it step-by-step?
- Does it cover Render + Vercel?
- Does it mention setting ANTHROPIC_API_KEY?
- Does it mention setting CLIENT_URL for CORS?
- Is it understandable for non-technical user?

#### 3. Validation Tests

**YAML validation:**
```bash
# Install yamllint if needed: pip install yamllint
yamllint render.yaml
```

Or paste render.yaml into online validator, verify no errors.

**TypeScript compilation:**
```bash
npm install
npm run build
```

Should succeed with no errors.

**Health endpoint check:**
```bash
npm run dev
# In another terminal:
curl http://localhost:3000/health
```

Should return `{"status":"ok"}`.

#### 4. Documentation Review

Read DEPLOYMENT.md completely.

Questions:
- Can a non-technical person follow it?
- Are all prerequisites listed?
- Are all steps in order?
- Are screenshots needed (none present is OK, but note if confusing)?
- Is troubleshooting section helpful?

#### 5. Security Check

- Is `.env.production` in `.gitignore`? (Check `.gitignore`)
- Are no real API keys committed?
- Is CORS not set to `origin: '*'` in production? (Should use CLIENT_URL)

### Report Format

```markdown
# Task 07 Audit Report

## 1. Commits
[paste git log]
[paste git diff --stat]

## 2. Config Review

### render.yaml
Valid YAML: YES / NO (error: ...)
Health check: PRESENT / MISSING
Env vars: CORRECT / MISSING: ...
Branch: CORRECT / WRONG

### Server Changes
CORS: ADDED / MISSING
CLIENT_URL: USED / HARDCODED
PORT: ENV VAR / HARDCODED

### Client Config
.env.example: PRESENT / MISSING
config.ts: CORRECT / BUG: ...
useSocket: USES CONFIG / HARDCODED

### DEPLOYMENT.md
Step-by-step: YES / UNCLEAR: ...
Covers Render: YES / INCOMPLETE
Covers Vercel: YES / INCOMPLETE
CORS setup: MENTIONED / MISSING
API key: MENTIONED / MISSING

## 3. Validation Tests

YAML validation: PASSED / FAILED: ...
TypeScript build: PASSED / FAILED: ...
Health endpoint: WORKING / FAILED: ...

[paste curl output]

## 4. Documentation Review

Clarity: CLEAR / CONFUSING: ...
Completeness: COMPLETE / MISSING: ...
Non-technical friendly: YES / TOO TECHNICAL: ...
Troubleshooting: HELPFUL / LACKING: ...

## 5. Security Check

.gitignore: CORRECT / MISSING .env.production
API keys: NONE COMMITTED / LEAKED: ...
CORS: SECURE / INSECURE: ...

## 6. Summary

Deployment configs: CORRECT / ISSUES: ...
Documentation: CLEAR / NEEDS WORK: ...
Security: OK / CONCERNS: ...

APPROVED FOR MERGE / REJECT: [reason]
```

### Constraints
- Do NOT edit any files
- Do NOT attempt actual deployment (no API keys)
- Validate YAML + TypeScript compilation
- Read DEPLOYMENT.md as if you're non-technical
- Report only verified facts
