# PR Report Generator

Production-ready web app for crawling up to 5 PR article URLs per run and exporting:

- A polished PDF report
- A full CSV summary

Built with Next.js App Router, TypeScript, Tailwind CSS, server-side crawling, `cheerio`, `jsPDF`, `jspdf-autotable`, and `papaparse`.

## Features

- Paste URLs one per line
- Remove empty lines automatically
- Deduplicate URLs before crawling
- Validate URL format
- Reject more than 5 URLs per report
- Crawl on the server via `POST /api/report`
- Per-URL success or failure status
- Export a professional A4 PDF report
- Export a complete CSV summary
- Supabase email/password authentication
- Supabase-backed per-user report history
- Responsive UI

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Cheerio
- jsPDF
- jspdf-autotable
- Papa Parse

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

1. Copy `.env.example` to `.env.local`
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In the Supabase SQL editor, run [supabase/report_runs.sql](./supabase/report_runs.sql)
4. Restart the dev server

This enables:

- Email/password sign-in and sign-up
- Per-user saved report history with RLS

## Production Build

```bash
npm run build
npm run start
```

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository into [Vercel](https://vercel.com/).
3. Framework preset should auto-detect as `Next.js`.
4. Build command: `npm run build`
5. Output setting: default Next.js output
6. Deploy with the default settings.

For crawl-only usage, no environment variables are required.
For auth and saved history, Supabase env variables are required.

## API

### `POST /api/report`

Request:

```json
{
  "urls": ["https://example.com/article"]
}
```

Response:

```json
{
  "items": [
    {
      "url": "https://example.com/article",
      "domain": "example.com",
      "title": "Article title",
      "category": "News",
      "description": "Article summary",
      "author": "Author name",
      "publishedTime": "2026-05-14T10:00:00Z",
      "status": "success",
      "error": "",
      "crawledAt": "2026-05-14T10:05:00Z"
    }
  ]
}
```

## Crawl Rules

- Max 5 URLs per request
- 12-second timeout per URL
- Server-side fetching to avoid CORS issues
- Parallel processing with `Promise.allSettled`

## Notes

- Some sites may block automated requests or omit metadata tags.
- Failed URLs still appear in the result table and exported files.
