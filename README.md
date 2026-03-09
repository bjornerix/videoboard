# VideoBoard

A Miro-style infinite canvas for video clips. Drop videos, arrange them spatially, and everything persists across sessions via Supabase.

## Quick Start

You need **Node.js** installed (v18+). If you don't have it:
- Mac: `brew install node`
- Or download from https://nodejs.org

Then run these three commands:

```bash
cd videoboard
npm install
npm run dev
```

This opens the app at **http://localhost:3000**.

## What You Can Do

- **Drag & drop** video files onto the canvas (mp4, webm, mov)
- **Pan** the canvas by clicking and dragging the background
- **Zoom** with scroll wheel
- **Drag** clips to rearrange them
- **Resize** clips from the bottom-right corner
- **Hover** a clip to see controls (mute/unmute, delete)
- **Switch boards** via the dropdown (top-left)
- **Create new boards** from the dropdown
- **Double-click** a board name to rename it
- Everything **persists** — close the browser, come back, it's all there

## Deploy to the Web

To make this accessible from anywhere (not just localhost):

```bash
npm install -g vercel
vercel
```

Follow the prompts. You'll get a URL like `videoboard-xxx.vercel.app`.

## Technical Details

- **Frontend:** React + Vite
- **Database:** Supabase Postgres (boards + clips tables)
- **File Storage:** Supabase Storage (public bucket)
- Videos are uploaded to Supabase and served via public CDN URLs
- Clip positions auto-save with 400ms debounce
