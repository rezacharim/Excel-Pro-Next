# Side-by-side announcements + photo picker

**Order: SQL → backend zip → frontend zip.** Same upload steps as last time.

---

## 1 · Supabase — `RUN_THIS_round11_announcement_photo.sql`

One column. Creates nothing, deletes nothing, safe to re-run.

## 2 · Backend — `excel-pro-nest-league-module.zip`

Drag `src`, `package.json`, `pnpm-lock.yaml`, `migration.sql` onto
`excel-pro-nest`. **Include `pnpm-lock.yaml`** — that's what broke the build
last time.

## 3 · Frontend — `excel-pro-next-league-page.zip`

Drag `src` onto `excel-pro-next`.

---

## What you asked for

### Side by side, league first

`/announcements` is now **two columns** instead of one long stack, and each
card has a photo.

The order is **League Registration → Trials → News**, newest first within each
group, regardless of posting date. So your league announcement leads even
though both went up the same day — and it stays leading when you post news
next week.

Below 768px wide (phones) they stack, because two columns on a phone is two
unreadable columns.

### Photo picker in the dashboard

The announcement form has a **Photo (optional)** field with two buttons:

- **Choose from gallery** — a thumbnail grid of every photo already in
  Dashboard → Gallery. Click one, done.
- **Upload a new photo** — pick a file, it uploads and is selected
  immediately. **It also lands in your Gallery**, so the next announcement can
  reuse it instead of you uploading the same team photo again.

Once chosen you see a preview with **Change photo** and **Remove**.

**Leaving it empty is fine** — the card falls back to a default photo for that
category (League gets the squad shot, Trials and News get banner images). I
made the photo optional on purpose: if posting news required finding a
picture every time, the news section would stop being updated within a month.

Limits: images only, 10MB max, with a clear message if either is exceeded.

---

## After it deploys

Go to Dashboard → Announcements → **Edit** on each of the two live ones and
add a photo. They'll show on the front page and the announcements page within
a minute.

## Still open

- **2026 or 2027 age groups** — needed before any roster is filed.
- **Trial venue, days, times, cost** — the trials announcement currently just
  says to call or email you.
- **The late-fee date** — the site and the announcement both say Aug 25. If
  you move it to Sep 20, edit the announcement's late-fee sentence too, or
  they will contradict each other on a money term.
