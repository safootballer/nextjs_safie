# SAFie Next.js — GitHub + Render Deployment Guide
# GitHub: https://github.com/safootballer
# =====================================================

## STEP 1 — Create the GitHub repo
# ─────────────────────────────────
# Go to: https://github.com/new
#
# Settings:
#   Repository name:  safie-nextjs
#   Visibility:       Private  ← important, keeps your API keys safe
#   Initialize:       NO (leave all checkboxes unchecked)
#
# Click "Create repository" — then come back here.


## STEP 2 — Get your GitHub Personal Access Token
# ─────────────────────────────────────────────────
# Go to: https://github.com/settings/tokens
# Click: "Generate new token (classic)"
#
# Settings:
#   Note:        safie-deploy
#   Expiration:  No expiration (or 1 year)
#   Scopes:      ✅ repo  (tick the top-level repo checkbox — selects all sub-items)
#
# Click "Generate token"
# COPY IT NOW — you won't see it again.


## STEP 3 — Push code to GitHub
# ──────────────────────────────
# Open terminal in your safie-nextjs folder, then run these commands
# one by one. When asked for password, paste your token from Step 2.

cd safie-nextjs

git init
git add .
git commit -m "Initial commit: SAFie Next.js"
git branch -M main
git remote add origin https://github.com/safootballer/safie-nextjs.git
git push -u origin main

# When prompted:
#   Username: safootballer
#   Password: [paste your token here]


## STEP 4 — Deploy on Render
# ───────────────────────────
# Go to: https://render.com
# Sign in with GitHub
#
# Click: "New +" → "Web Service"
# Connect your GitHub account if not already
# Select repo: safootballer/safie-nextjs
#
# Settings (fill these in):
#   Name:            safie-nextjs
#   Region:          Oregon (US West)  ← or Singapore if closer
#   Branch:          main
#   Runtime:         Node
#   Build Command:   npm install && npx prisma generate && npm run build
#   Start Command:   npm start
#   Plan:            Free (or Starter for always-on)
#
# Click "Advanced" to add environment variables (see Step 5)


## STEP 5 — Environment Variables in Render
# ──────────────────────────────────────────
# In Render dashboard → your service → "Environment" tab
# Add each of these:

# ┌─────────────────────────┬──────────────────────────────────────────────────┐
# │ Key                     │ Value                                            │
# ├─────────────────────────┼──────────────────────────────────────────────────┤
# │ NODE_ENV                │ production                                       │
# │ NEXTAUTH_URL            │ https://safie-nextjs.onrender.com                │
# │                         │  ↑ Replace with your actual Render URL           │
# │ NEXTAUTH_SECRET         │ [generate: openssl rand -base64 32]              │
# │                         │  ↑ Run that command in terminal and paste result │
# │ DATABASE_URL            │ [your PostgreSQL connection string]              │
# │                         │  ↑ Same value from your Streamlit .env           │
# │ OPENAI_API_KEY          │ sk-...  (same as Streamlit)                      │
# │ SANITY_PROJECT_ID       │ [same as Streamlit]                              │
# │ SANITY_DATASET          │ production                                       │
# │ SANITY_TOKEN            │ [same as Streamlit]                              │
# │ FACEBOOK_PAGE_ID        │ [same as Streamlit]                              │
# │ FACEBOOK_PAGE_TOKEN     │ [same as Streamlit]                              │
# │ PRISMA_ENGINES_CHECKSUM │                                                  │
# │   _IGNORE_MISSING       │ 1                                                │
# └─────────────────────────┴──────────────────────────────────────────────────┘

# HOW TO GENERATE NEXTAUTH_SECRET:
#   Mac/Linux:  openssl rand -base64 32
#   Windows:    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# WHERE IS YOUR DATABASE_URL?
#   It's in your Streamlit app's .env file or Heroku/Railway/Render config.
#   Format: postgresql://USER:PASSWORD@HOST:5432/DBNAME
#   If on Heroku: heroku config:get DATABASE_URL --app your-app-name


## STEP 6 — Add logos
# ────────────────────
# Copy your logo files into the public/ folder before pushing:
#
#   public/logo.png    ← SA Footballer logo (from your Streamlit assets/logo.png)
#   public/logo2.png   ← SAFie logo (from your Streamlit assets/logo2.png)
#
# Then commit and push:
#   git add public/logo.png public/logo2.png
#   git commit -m "Add logos"
#   git push
#
# Render will auto-redeploy on every push to main.


## STEP 7 — After deploy: update NEXTAUTH_URL
# ─────────────────────────────────────────────
# Once Render gives you your URL (e.g. https://safie-nextjs.onrender.com):
# Go to: Render dashboard → Environment → NEXTAUTH_URL
# Update it to your actual URL.
# Render will redeploy automatically.


## AUTO-DEPLOY
# ─────────────
# Every time you push to GitHub main branch, Render rebuilds and redeploys.
# No manual steps needed after initial setup.
#
# To push updates:
#   git add .
#   git commit -m "Your change description"
#   git push


## TROUBLESHOOTING
# ─────────────────
# Build fails "prisma generate":
#   → Make sure PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 is set in Render env vars
#
# "Invalid token" on login:
#   → Check NEXTAUTH_SECRET is set and NEXTAUTH_URL matches your Render URL exactly
#
# Database connection error:
#   → Check DATABASE_URL format starts with postgresql:// not postgres://
#   → Render free DBs sleep after inactivity — use your existing Heroku/Railway DB
#
# Logo not showing:
#   → Make sure logo.png and logo2.png are in public/ folder and committed to git
