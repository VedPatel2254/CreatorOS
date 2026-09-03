# CreatorOS

Work management and billing application for freelance video editors and creative agencies.

## Features
- **Client Management** — Store client details, pricing rules, and billing preferences
- **Task & Delivery Tracking** — Track reels, posts, and custom work types with status transitions
- **Master Calendar** — Unified calendar view with month, week, day, and agenda views
- **PDF Calendar Import** — Upload content calendars and auto-extract tasks with review screen
- **Billing Engine** — Accurate billing for per-item, monthly package, and one-off clients
- **Invoice Generation** — Detailed, summary, and package invoices with PDF download
- **Push Notifications** — Cloud-backed deadline reminders that work without your laptop
- **PWA** — Installable on desktop and mobile, works offline for cached pages
- **Dashboard** — Real-time overview with global search, onboarding checklist

## Tech Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **PDF Generation**: @react-pdf/renderer
- **PDF Parsing**: pdf-parse
- **Push Notifications**: Web Push API (VAPID)
- **Scheduled Jobs**: Supabase pg_cron + Edge Functions
- **Deployment**: Vercel + Supabase

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase account (free tier works)

### 1. Clone and Install

```bash
git clone <repo-url>
cd creatoros
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to Project Settings → API and copy:
   - Project URL
   - anon/public key
   - service_role key

3. Run all SQL migrations in order (Phases 1-8)

4. Create Storage buckets: `logos` (public) and `imports` (private)

5. Enable extensions: uuid-ossp, pg_cron, pg_net

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values. See `.env.example` for descriptions.

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add all environment variables from `.env.example`
4. Deploy

### Configure Supabase for Production

Follow `docs/supabase-setup.md`.

Update Supabase Auth settings:
- Site URL: your Vercel deployment URL
- Redirect URL: your Vercel URL + `/auth/callback`

## Development Phases

CreatorOS was built in 10 phases:
1. Foundation & Auth
2. Client Management
3. Task Management
4. Master Calendar
5. PDF Import
6. Billing Engine
7. Invoice Generation
8. Push Notifications
9. Dashboard
10. PWA & Production

## License

Private — personal use only.
