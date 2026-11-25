# Quill

Blogging app with a post editor and end-to-end encrypted cloud sync.

**Live:** https://blogging-platform.mahmodsalah.workers.dev

## Features

- Write, edit, and browse posts
- Optional encrypted sync of all posts between devices; the server never sees plaintext
- Responsive reading layout

## Tech stack

React, TypeScript, Vite

## Hosting

Cloudflare Workers (static assets) + Workers/KV API for sync. No paid services.

## Run locally

```bash
npm install
npm run dev
```

Build with `npm run build`, type-check with `npx tsc --noEmit`.

## Notes

Sync client lives in src/.

## Author

Mahmoud Salah, https://github.com/engMahmoudSalah
