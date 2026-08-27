# Hosting Specification & Recommendation

**Project:** Mediron Sales & Distribution Management System (MMS Prime)
**Prepared for:** Client review
**Date:** 2026-08-25

---

## 1. Executive Summary

The application is built on a modern architecture: a static frontend (React) that connects to a managed backend (database, authentication, real-time notifications, push notifications). This document specifies the hosting requirements and explains the recommended setup, which keeps costs low and reliability high.

---

## 2. Measured Application Profile

| Item | Measured value |
|---|---|
| Website build size | 4.5 MB total |
| Main JavaScript bundle | 1.5 MB (405 KB gzipped) |
| CSS bundle | 68 KB |
| Database tables | 31 |
| Database schema size | ~128 KB SQL (grows with data) |
| Image storage | External (ImgBB) — not on the hosting server |

---

## 3. Traffic Assumption: 50,000 Users / Day

Used as the planning ceiling.

| Metric | Value |
|---|---|
| Daily active users | 50,000 |
| Avg. data per user session | ~4-6 MB |
| Daily bandwidth (raw, uncached) | ~225 GB |
| Monthly bandwidth (raw, uncached) | ~6.7 TB |
| Monthly bandwidth with CDN caching | ~2-3 TB |

---

## 4. Hosting Requirements (Frontend)

These are the minimum specifications for serving the website itself.

| Item | Requirement | Notes |
|---|---|---|
| Disk space | **10 GB** | Website files + build history + backups |
| Monthly bandwidth | **3 TB** | Safe margin for 50k users/day with CDN |
| RAM | **2 GB** | Only needed if backend logic runs on this server |
| Node.js | Optional | Only if backend services are self-hosted here |
| HTTPS / SSL | **Required** | Needed for login, push notifications, camera access |
| CDN | **Cloudflare (free)** | Cuts bandwidth 60-80%, adds security |

**Important:** Standard shared hosting plans in BD typically cap at 50-200 GB/month bandwidth. They **cannot** serve 50,000 users/day. A VPS or CDN-protected setup is required at that scale.

---

## 5. Database & Backend Services

This is the "engine" of the application and should remain on a managed platform (currently Supabase).

| Service | Included | Why |
|---|---|---|
| Database (PostgreSQL) | Yes | 500 MB free; ~1-2 GB covers 1-2 years of data |
| User authentication & sessions | Yes | Login, roles, security — already built |
| Real-time notification bell | Yes | Instant updates, no polling needed |
| Web push notifications | Yes | Browser notifications to staff/dealers |
| Password reset emails | Yes | Automatic, secure |
| Automatic backups | Yes | Managed by platform |

**Why not move this to shared hosting:**
- Shared hosts do not allow installing a full PostgreSQL server.
- Moving to MySQL requires rewriting the database schema, security rules, and all real-time features.
- Password reset, login sessions, and push notifications would all have to be rebuilt from scratch.
- Result: weeks of extra development work to deliver fewer features, at higher long-term cost.

---

## 6. Cost Comparison (Monthly)

| Option | Monthly cost | What you get |
|---|---|---|
| **Recommended:** Frontend on BD hosting + managed backend | **0 Tk now** | 50k users/mo, realtime, push, backups, no maintenance |
| Same, scaled for growth | ~3,000 Tk | 4x limits, when traffic outgrows free tier |
| BD VPS (full self-host) | 3,000-6,000 Tk | You manage server, DB, backups, security yourself |
| Shared hosting only | 1,000-2,000 Tk | **Cannot handle 50k users/day; features reduced** |

---

## 7. Recommended Architecture

```
Users
  |
  v
[BD Hosting / Netlify / Vercel]   <- Frontend: static React app (client's choice)
  |          |
  |          +--[Cloudflare CDN]  <- caching, security, bandwidth savings
  |
  v
[Managed Backend (Supabase)]      <- Database, Auth, Realtime, Push, Email
```

- The frontend can be hosted **anywhere** the client prefers (including BD hosting) — it is just static files.
- The backend stays on the managed platform because it provides the features that make the app valuable.

---

## 8. Recommendation

1. **Keep the backend on the managed platform.** It is free at current scale, includes security and backups, and moving it would reduce features and increase cost.
2. **Host the frontend wherever the client prefers** (BD hosting works fine for static files).
3. **Add Cloudflare (free)** to reduce bandwidth and protect the site.
4. **If 50,000 users/day becomes real traffic**, upgrade the backend plan (~3,000 Tk/mo) — still cheaper than self-hosting everything.

---

*Prepared by the development team. All figures are based on the measured application and standard cloud pricing as of 2026.*
