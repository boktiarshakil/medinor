# Hosting & Pricing Summary

**Project:** Mediron Sales & Distribution Management System
**Prepared for:** Client
**Date:** 2026-08-25

---

## 1. Where the app runs

| Part | Where | Why |
|---|---|---|
| Website (frontend) | Any host you prefer — BD hosting works fine | It's just website files |
| Database, login, notifications | Managed platform (Supabase) | This is the "engine" — provides login, real-time alerts, push notifications, backups |

The website and the engine are separate. You can host the website wherever you like; the engine is managed for us (no server maintenance, automatic backups, built-in security).

---

## 2. What it costs

| Stage | Monthly cost |
|---|---|
| Now (up to ~50k users/month) | **Free** |
| When we outgrow it | ~$25/month (~3,000 Tk) |
| Only logged-in users count | Guest customers (COD, no login) cost nothing |

> "50,000 users" counts people who **log in**. Customers who browse or order as guests do not count, so the free plan lasts longer than it sounds.

---

## 3. Hosting for the website (BD hosting)

- Disk space: **10 GB** is enough (the website is only ~5 MB)
- Bandwidth: **3 TB/month** recommended for high traffic
- SSL certificate: required (secure login)

Standard BD shared hosting often caps at 50-200 GB/month — enough to start, but a VPS or Cloudflare (free) is recommended as traffic grows.

---

## 4. Can we upgrade later?

**Yes, easily.**
- Moving the website to a bigger server = copying files, no disruption.
- The engine scales with a plan upgrade — no code changes needed.
- No lock-in: we can migrate to a VPS whenever it becomes worthwhile.

---

## 5. Bottom line

- The system is **free to run now**, and cheap (~3,000 Tk/mo) at scale.
- You can use BD hosting for the website.
- Everything stays upgradable — nothing blocks growing later.
