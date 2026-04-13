# SAFie — Next.js

AI-Powered Match Report Generation by SA Footballer.
This is a **parallel Next.js version** of the existing Streamlit app. Both point at the **same PostgreSQL database** — no data is duplicated.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Auth | NextAuth.js v5 (credentials, JWT) |
| Database | PostgreSQL via **Prisma** (same DB as Streamlit) |
| AI | OpenAI gpt-4o-mini (same model) |
| CMS | Sanity (same project/dataset) |
| Social | Facebook Graph API v19 |
| Styling | Tailwind CSS (SAFie brand: blue #2ca3ee / yellow #e6fe00) |

---

## Quickstart

### 1. Install
```bash
cd safie-nextjs
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Fill in your actual values
```

All values are IDENTICAL to your Streamlit .env:
- DATABASE_URL        — same PostgreSQL connection string
- OPENAI_API_KEY      — same key
- SANITY_PROJECT_ID   — same
- SANITY_TOKEN        — same
- SANITY_DATASET      — same
- FACEBOOK_PAGE_ID    — same
- FACEBOOK_PAGE_TOKEN — same
- NEXTAUTH_SECRET     — NEW: run: openssl rand -base64 32
- NEXTAUTH_URL        — http://localhost:3000 for local dev

### 3. Generate Prisma client (no migration — uses your live DB)
```bash
npx prisma generate
```

### 4. Run
```bash
npm run dev
# http://localhost:3000
# Login with existing admin credentials (same DB)
```

### 5. Build for production
```bash
npm run build && npm start
```

---

## Deploy to Vercel
```bash
npm i -g vercel && vercel
# Add all env vars in Vercel dashboard > Settings > Environment Variables
# Update NEXTAUTH_URL to your Vercel URL after deploy
```

---

## Project Structure

```
safie-nextjs/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   NextAuth handler
│   │   ├── matches/              GET active match links
│   │   ├── knowledge-base/       POST fetch PlayHQ + build context
│   │   ├── generate/             POST OpenAI generation + cost tracking
│   │   ├── publish/              POST Sanity CMS publisher
│   │   └── facebook/             POST Facebook Graph API
│   ├── dashboard/
│   │   ├── layout.tsx            Auth guard + sidebar
│   │   └── page.tsx              Main 4-step workflow
│   ├── login/page.tsx            Login form
│   └── providers.tsx             SessionProvider wrapper
├── components/
│   ├── Sidebar.tsx               Left nav with user info + metrics
│   └── steps/
│       ├── MatchSelectStep.tsx   Step 1: pick matches
│       ├── KnowledgeStep.tsx     Step 2: build knowledge base
│       ├── GenerateStep.tsx      Step 3: AI generation + FB post
│       └── PublishStep.tsx       Step 4: Sanity publish
├── lib/
│   ├── auth.ts                   NextAuth config (SHA-256, same as Streamlit)
│   ├── prisma.ts                 Prisma singleton
│   ├── playhq.ts                 PlayHQ GraphQL fetcher (exact port from Python)
│   ├── publishers.ts             Sanity + Facebook publishers
│   └── constants.ts              Prompts, authors, leagues, cost calc
├── prisma/schema.prisma          Mirrors your SQLAlchemy models exactly
├── middleware.ts                 Protects /dashboard routes
└── .env.example                  Copy to .env.local
```

---

## Shared with Streamlit (nothing breaks)

| Resource              | Shared |
|-----------------------|--------|
| PostgreSQL DB         | YES — same tables, same data |
| User accounts         | YES — same SHA-256 password hashes |
| Match links           | YES — same match_links table |
| Saved match data      | YES — same matches table |
| Cost tracking         | YES — same generation_costs table |
| Sanity CMS content    | YES — same project + dataset |
| Facebook page         | YES — same page token |
| OpenAI API key        | YES — same key |

---

## Add logos

Copy from your Streamlit assets/ folder into public/:
- public/logo.png   (SA Footballer logo)
- public/logo2.png  (SAFie logo)

---

## Notes

The LangChain RAG/vector step from Streamlit is simplified: the full match
context string is sent directly to OpenAI. This is equivalent since
gpt-4o-mini has a 128k context window. For future multi-match scale,
LangChain.js vector store can be added as a drop-in.
