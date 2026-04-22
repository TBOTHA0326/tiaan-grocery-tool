# Tiaan Grocery Tool

A minimalist grocery list web app built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- Grocery items grouped by category
- Add, edit, complete, delete items
- Drag-and-drop ordering with mobile fallback controls
- Category management with custom icons
- Item price support in South African rand (R)
- Bottom-sheet modals optimized for mobile
- Supabase auth with email/password login
- Supabase persistence with realtime sync
- Light / dark theme toggle

## Tech stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase Postgres
- Lucide icons
- dnd-kit for reorder interactions

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `./.env.local` with your Supabase details:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Run the app locally:

```bash
npm run dev
```

4. Initialize Supabase schema with the migration SQL in `supabase/migrations/0001_init.sql`.

## Deployment

Deploy on Vercel using the same environment variables.

## Project structure

- `app/` – Next.js application routes and layout
- `components/` – reusable UI primitives and sheet components
- `lib/` – Supabase client helper
- `hooks/` – utility hooks for local storage
- `supabase/migrations/` – database schema migrations
- `.env.local` – local Supabase config
