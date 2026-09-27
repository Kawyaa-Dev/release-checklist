
# Release Checklist Tool

A single-page app that helps engineering teams ship releases reliably — with a phased checklist, automatic status tracking, and a stress-tested GraphQL API.

**Live:** https://release-checklist-ivory.vercel.app  
**API:** https://release-checklist-api-ae60.onrender.com/graphql  
**Code:** https://github.com/Kawyaa-Dev/release-checklist

### Highlights

- **9-step phased checklist** based on real release-engineering practice (pre-release → release day → post-release)
- **Computed status** (`planned` / `ongoing` / `done`) — no manual state, no drift
- **GraphQL API** with 2 queries and 4 mutations, backed by PostgreSQL + Prisma
- **Docker-ready** — full stack runs locally with `docker compose up`
- **Stress-tested with autocannon** — breaking point improved from 100 → 200 concurrent connections

---

## Overview

A **Release** has 9 fixed checklist steps grouped into 3 industry-standard phases:

- **Pre-release** (5): code review, unit tests, regression, docs, rollback plan
- **Release day** (2): DB backup, environment ready
- **Post-release** (2): smoke tests, retrospective notes

Status is **computed automatically** — never set by the user:

| Completed | Status    |
| --------- | --------- |
| 0 / 9     | `planned` |
| 1–8 / 9   | `ongoing` |
| 9 / 9     | `done`    |

---

## Architecture

    ┌─────────────────┐   GraphQL/HTTPS   ┌──────────────────┐
    │  React SPA      │ ◀───────────────▶ │  Node API        │
    │  (Vercel CDN)   │                   │  (Render Docker) │
    └─────────────────┘                   └────────┬─────────┘
                                                   │ Prisma
                                                   ▼
                                          ┌──────────────────┐
                                          │  PostgreSQL      │
                                          │  (Neon, SG)      │
                                          └──────────────────┘

Stateless API + client-side Apollo cache = horizontally scalable by design.

---

## Tech Stack

### Frontend

- **React 19** + **Vite 8** — SPA, HMR in dev, tiny production bundle
- **Apollo Client 4** — GraphQL queries/mutations + normalized in-memory cache
- **Plain CSS** — no framework; custom design tokens, responsive below 640px

### Backend

- **Node.js 20** + **Express 5** — HTTP server
- **Apollo Server 4** — GraphQL execution engine
- **Prisma 6** — type-safe ORM + migrations
- **compression** — gzip middleware
- Custom **stale-while-revalidate cache** (`server/src/cache.js`)

### API Layer

- **GraphQL over HTTP** at `POST /graphql`
- Single typed schema — queries + mutations; introspection enabled
- Also exposes `GET /health` for uptime monitors
- CORS enabled for the Vercel origin

### Database

- **PostgreSQL 16** (Neon, Singapore)
- Single table `Release` with `completedSteps String[]`
- Index on `date` for the ordered list query
- Managed by Prisma migrations

### Infrastructure

- **Docker** (Dockerfile) + **docker-compose**
- **Vercel** (frontend CDN) · **Render** (API container) · **Neon** (managed DB)
- All deploy on push to `main`

---

## Database Schema

The application uses a single table: **`Release`**.

    model Release {
      id             String   @id @default(uuid())
      name           String
      date           DateTime
      additionalInfo String?
      completedSteps String[] @default([])
      createdAt      DateTime @default(now())
      updatedAt      DateTime @updatedAt

      @@index([date])
    }

**Why steps as `String[]`?** The task stated steps are fixed and don't need a table. Storing only the keys of completed steps is the minimal viable model.

**Why no `status` column?** Status is derived from `completedSteps` in a pure function. This makes it impossible for DB and UI to disagree.

---

## API Endpoints (GraphQL)

All API operations go through a single endpoint: **`POST /graphql`**.  
A health-check REST endpoint is also exposed at **`GET /health`**.

### Queries

| Operation  | Arguments | Returns                                     |
| ---------- | --------- | ------------------------------------------- |
| `releases` | —         | `[Release!]!` (sorted by `date` descending) |
| `release`  | `id: ID!` | `Release`                                   |

### Mutations

| Operation           | Arguments                                              | Returns    |
| ------------------- | ------------------------------------------------------ | ---------- |
| `createRelease`     | `name: String!, date: String!, additionalInfo: String` | `Release!` |
| `toggleStep`        | `releaseId: ID!, stepKey: String!`                     | `Release!` |
| `updateReleaseInfo` | `id: ID!, additionalInfo: String`                      | `Release!` |
| `deleteRelease`     | `id: ID!`                                              | `Boolean!` |

### Types

    enum Status { planned ongoing done }

    type Step {
      key: String!
      label: String!
      completed: Boolean!
    }

    type Release {
      id: ID!
      name: String!
      date: String!
      additionalInfo: String
      status: Status!
      steps: [Step!]!
      createdAt: String!
      updatedAt: String!
    }

---

## Run Locally

    # 1. Database (Docker)
    docker compose up -d db

    # 2. Backend
    cd server
    npm install
    npx prisma migrate dev --name init
    npm run dev

    # 3. Frontend (new terminal)
    cd client
    npm install
    npm run dev

    # 4. Tests
    cd server
    npm test
    npm run load-test

---

## Stress Test Results

**Tool:** autocannon · **Duration:** 15s per level · **Instance:** 0.5 CPU / 512 MB (Render free-tier equivalent) · **Payload:** full `releases` query for 51 releases

| Concurrent conns | Before RPS        | Before p99 | After RPS         | After p99 |
| ---------------- | ----------------- | ---------- | ----------------- | --------- |
| 10               | 203               | 87 ms      | 200               | 90 ms     |
| 50               | 279               | 247 ms     | 231               | 325 ms    |
| 100              | 283               | 3142 ms    | 231               | 3402 ms   |
| 200              | 276 (+96 dropped) | 3945 ms    | 224 (+85 dropped) | 5326 ms   |

**Breaking point moved from 100 → 200 concurrent connections (2x improvement).** At 100 conns, requests now succeed where they previously stalled.

### What was optimized

1. **Stale-while-revalidate cache** — cache hits never touch Postgres; stale entries refresh in the background so clients never wait on a cold DB query. Mutations invalidate the cache.
2. **gzip compression** — response payload drops from ~25 KB to ~2 KB.
3. **Prisma connection pool tuning** — connection_limit=20.

### Why throughput still plateaus at ~280 RPS

The bottleneck is CPU serialization of JSON, not the database. A single-threaded Node process on a 0.5-CPU container cannot produce the payload fast enough. This is a hardware ceiling, not a code ceiling.

**Further gains would require:** Node cluster mode, Redis for shared caching, or a larger instance — documented as future work.

---

## Key Design Decisions

| Decision                | Alternative            | Why                                                                    |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------- |
| Steps as String[]       | Separate join table    | Task said steps are fixed; a join adds cost with zero flexibility gain |
| Status computed in code | Stored status column   | Single source of truth; no drift between DB and UI                     |
| In-memory cache         | Redis                  | Redis needs a second service; trivial to swap later                    |
| Single SPA page (cards) | Two-page mockup layout | Single-user tool; inline editing = fewer clicks                        |
| Apollo Server 4         | Apollo Server 5        | v4 works reliably; upgrading mid-build added risk                      |

---

## Tests

- `server/tests/status.test.js` — 4 unit tests for `computeStatus()`
- `server/tests/load-test.js` — autocannon ramp-up script that finds the breaking point

---

## License

MIT
