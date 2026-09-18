# Hike-Globally: Payload CMS Integration Documentation

## Overview

Hike-Globally integrates **Payload CMS 3.x** backed by **PostgreSQL** alongside the existing **Vite + React SPA**. 

The integration preserves 100% of the original styling, animations (Framer Motion + GSAP), routing, interactive drawers, booking logic, and custom components, while enabling non-technical editors to manage trips, destinations, journal articles, categories, and media through a unified admin panel.

---

## Architecture Diagram

```
+-------------------------------------------------------------+
|                      User Browser                           |
|  - Visits https://hikeglobally.com                          |
|  - Custom Client Router (/, /trips, /destinations, /blog)   |
|  - Booking Drawer (pure client-side state)                  |
+------------------------------+------------------------------+
                               |
                               | REST Requests (/api/*)
                               v
+-------------------------------------------------------------+
|               Nginx Reverse Proxy / Vite Proxy              |
|  - /             --> Static React SPA (dist/index.html)     |
|  - /admin        --> Payload Admin Panel (Port 3000)        |
|  - /api/*        --> Payload REST API (Port 3000)           |
|  - /media/*      --> Uploaded Media directory / Next.js     |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|               Payload CMS 3.x (Next.js Server)              |
|  - Authentication & Access Control (Admin vs Public Read)   |
|  - Rich Text Editor (Lexical)                               |
|  - Drafts & Publishing Lifecycle                            |
|  - Sharp Image Resizing (thumbnails, cards, heroes)         |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 PostgreSQL Database (v16+)                  |
|  - Tables: users, media, categories, destinations, trips,   |
|    blogs, payload_preferences, payload_migrations           |
+-------------------------------------------------------------+
```

---

## Collections & Schemas

### 1. `users` (`cms/src/collections/Users.ts`)
- **Fields:** `email`, `password`, `name`, `role` (`admin` | `editor`).
- **Access Control:** Public registration disabled; only authenticated users can read/write.
- **Default Superadmin:** `admin@hikeglobally.com` / `password123`.

### 2. `media` (`cms/src/collections/Media.ts`)
- **Storage:** Local disk at `cms/media` (or S3 in cloud).
- **Image Variants (Sharp):**
  - `thumbnail`: 320×240 (cover)
  - `card`: 720×480 (cover)
  - `hero`: 1920×1080 (cover)
- **Access Control:** Public read; authenticated users can create/update/delete.

### 3. `categories` (`cms/src/collections/Categories.ts`)
- **Fields:** `title`, `slug`, `description`.
- **Access Control:** Public read; authenticated users can create/update/delete.

### 4. `destinations` (`cms/src/collections/Destinations.ts`)
- **Fields:**
  - `name`, `slug` (unique)
  - `tagline`, `heroTitle`, `heroSubtitle`, `description`
  - `badge`, `quote`, `quoteAuthor`
  - `overview`, `bestSeason`, `cultureHighlight`, `entryFee`
  - `elevationRange`, `permitNotice`, `recommendedMonths`
  - `image` (relationship to `media` or fallback URL)
  - `stats`: Array of `{ label, value }`
  - `order`: Number for sorting
- **Drafts & Publishing:** Enabled. Public can only read `_status = 'published'`.

### 5. `trips` (`cms/src/collections/Trips.ts`)
- **Fields:**
  - `title`, `slug` (unique), `location`
  - `destination` (relationship to `destinations`)
  - `destinationName` (string fallback e.g. "Everest", "Annapurna")
  - `duration` (string e.g. "14 days"), `durationDays` (number: 14)
  - `difficulty` (`Easy` | `Moderate` | `Challenging` | `Extreme`)
  - `tripType` (`Trek` | `Expedition` | `Cultural` | `Safari`)
  - `price` (number in USD)
  - `seasons` (array of `Spring` | `Autumn` | `Winter` | `Summer`)
  - `primeSeason`, `departures`, `elevation`, `highlight`, `availability`
  - `shortDescription`, `description`
  - `image` (relationship to `media` or fallback `imageUrl`)
  - `featured`: boolean
  - `itinerary`: Array of `{ day: number, title: string, description: string, elevation: string }`
  - `inclusions`: Array of `{ item: string }`
  - `exclusions`: Array of `{ item: string }`
- **Drafts & Publishing:** Enabled. Public can only read `_status = 'published'`.

### 6. `blogs` (`cms/src/collections/Blogs.ts`)
- **Fields:**
  - `title`, `slug` (unique), `subtitle`, `excerpt`
  - `content` (Rich Text / Lexical editor)
  - `markdownContent` (verbatim raw Markdown preservation)
  - `coverImage` (relationship to `media` or fallback `coverImageUrl`)
  - `author` (relationship to `users` or fallback name)
  - `category` (relationship to `categories`)
  - `readTime`, `publishedAt`
  - `seo`: `{ metaTitle, metaDescription, metaImage }`
- **Drafts & Publishing:** Enabled. Public can only read `_status = 'published'`.

---

## Frontend Integration Layer

Located in `src/services/payload/`:

- `client.js`: Robust REST client with timeout handling, in-memory caching (60s TTL), nested parameter serialization, and automatic URL resolution (respects `VITE_PAYLOAD_URL` or relative proxy).
- `media.js`: Media helper resolving image URLs from either Payload Media objects (with responsive size variants) or static image strings.
- `trips.js`: `useTrips()` and `useTrip(slug)` React hooks with instant static fallback.
- `destinations.js`: `useDestinations()` and `useDestination(slug)` React hooks with instant static fallback.
- `blogs.js`: `useBlogs()` and `useBlog(slug)` React hooks with instant static fallback.
- `index.js`: Clean single barrel export for all hooks and utilities.

### Zero-Flicker Fallback Mechanism

Every page and component (`RegionExplorer`, `DestinationsSection`, `JournalSection`, `TripCollection`, `TripsPage`, `DestinationsPage`) renders immediately with the built-in static content. 

When the Payload CMS API is reachable, the hooks automatically hydrate the view with live database records, without screen flicker or broken states. If the CMS is offline, the website remains 100% operational.

---

## Running Locally

### Prerequisites
- Node.js 20+
- PostgreSQL (or run the embedded starter)

### Commands

1. **Start embedded local PostgreSQL (port 54329):**
   ```bash
   npm run cms:db
   ```

2. **Seed sample data and admin user:**
   ```bash
   npm run cms:seed
   ```

3. **Start Payload CMS dev server (port 3000):**
   ```bash
   npm run cms:dev
   ```

4. **Start Vite Frontend dev server (port 5173):**
   ```bash
   npm run dev
   ```

5. **Run test suite & build:**
   ```bash
   npm test
   npm run build
   npm run lint
   ```

### Admin URL & Credentials
- **Admin Panel:** [http://localhost:5173/admin](http://localhost:5173/admin) (via Vite proxy) or [http://localhost:3000/admin](http://localhost:3000/admin)
- **Email:** `admin@hikeglobally.com`
- **Password:** `password123`
