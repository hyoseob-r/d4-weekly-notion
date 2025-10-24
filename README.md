# Diablo4 Weekly Notion Updater (Free, GitHub Actions)

This package creates a **weekly Notion page** every Friday 09:00 KST with a structured template for Diablo IV meta builds.
It does **not** require any paid API. You only need a Notion Internal Integration token and a Notion Database.

## Quick Setup

1) Create a Notion Integration: https://www.notion.so/my-integrations (Read/Write)
2) Share your target Notion Database with the integration.
3) Get your **Database ID** (the long hex in the database URL).
4) Create a new GitHub repository, upload these files.
5) In GitHub → Settings → Secrets and variables → Actions:
   - `NOTION_TOKEN` = your integration token
   - `NOTION_DATABASE_ID` = your database id
6) The workflow runs every Friday 09:00 KST (00:00 UTC). You can also trigger it manually via **Run workflow**.

## Notion Database Properties
- **Name** (title)
- **Week** (rich_text) — optional

## What it does
- Creates a new page under the database with a full scaffold:
  - Sources
  - Per-class sections (Start/End setups)
  - Placeholders for Items, Gems, Glyphs, Specialization, Skills, Paragon, Seasonal mechanic, Efficiency, Diffs

You can later enhance `index.js` to fetch and parse live data.
