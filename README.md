# Tiaan Grocery + Expense Tracker

A clean grocery and expense tracker. Add grocery items and expenses, assign categories, mark purchases, and keep entries synced through Supabase.

## What it does

- Add grocery and expense entries in one simple workflow
- Track grocery quantities and purchase status
- See grocery totals, expense totals, and combined value
- Save data to Supabase for cross-device sync
- Local fallback remains available if you are not signed in

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your Supabase details:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Apply the Supabase migration or create the `entries` table using `supabase/migrations/0001_init.sql`.

4. Start the development server:

```bash
npm run dev
```

5. Open the app at `http://localhost:3000`

## Notes

- Sign in with email/password to sync your list across devices.
- If you do not sign in, the app still keeps a local copy in the browser.

## Project files

- `app/` – application UI and page routes
- `components/Tracker.tsx` – core tracker interface and Supabase sync logic
- `app/globals.css` – global styling
- `supabase/migrations/` – DB schema for cross-device storage
