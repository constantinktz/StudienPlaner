# StudienPlaner

A full-stack Study Planner SPA for students of FH Dortmund (Germany).

## Features

- 🎓 Auto-detect degree program from Matrikel number
- 🔗 Connect FH Dortmund portal to sync module progress
- 📅 View current timetable fetched from the public FH REST API
- 💡 Smart recommendations (pull forward, retry, missing modules)
- 📋 Drag-and-drop semester planner

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env
# Edit .env and set secure values for JWT_SECRET and ENCRYPTION_KEY

# 2. Start all services
docker compose up -d

# 3. Open the app
open http://localhost:3000
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (SPA)                       │
│  React 18 + TypeScript + Vite + Tailwind CSS            │
│  TanStack Query · Zustand · React Router v6             │
│  FullCalendar · dnd-kit · React Hook Form + Zod         │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP (Axios, HttpOnly cookies)
                         ▼
┌─────────────────────────────────────────────────────────┐
│               Backend (port 5000 → 8080)                │
│  .NET 9 Minimal API · EF Core · BCrypt · JWT            │
│  AngleSharp (portal scraping) · AES-256-GCM             │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
    ┌──────▼──────┐            ┌──────▼──────┐
    │  PostgreSQL │            │    Redis    │
    │  (EF Core)  │            │  (caching) │
    └─────────────┘            └─────────────┘
           │
    ┌──────▼──────────────────────────┐
    │  FH Dortmund Public REST API    │
    │  ws.inf.fh-dortmund.de/fbws/…   │
    └─────────────────────────────────┘
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL password | `studienplaner_local_dev_pw` |
| `JWT_SECRET` | JWT signing secret (≥32 chars) | `dev-secret-change-this-to-something-long-and-secure-32chars` |
| `ENCRYPTION_KEY` | AES-256 key as 64-char hex string | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `REDIS_CONNECTION` | Redis connection string | `redis:6379` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins (comma-separated) | `http://localhost:3000` |

## API Overview

| Group | Endpoint | Description |
|---|---|---|
| Auth | `POST /api/auth/register` | Register a new account |
| Auth | `POST /api/auth/login` | Login, get JWT cookie |
| Auth | `POST /api/auth/portal-login` | Connect FH portal |
| Auth | `DELETE /api/auth/portal-logout` | Disconnect FH portal |
| User | `GET/PUT /api/user/profile` | Get or update profile |
| Schedule | `GET /api/schedule/courses` | List all degree programs |
| Schedule | `GET /api/schedule/mine` | Your current timetable |
| Schedule | `GET /api/schedule/{key}/{semester}` | Timetable for any course |
| Schedule | `GET /api/schedule/mine/ical` | Export timetable as iCal |
| Portal | `POST /api/portal/sync` | Sync module progress |
| Portal | `GET /api/portal/modules` | List synced modules |
| Planner | `GET/POST /api/planner/studyplan` | Manage study plan |
| Planner | `GET /api/planner/recommendations` | AI-powered suggestions |
| Health | `GET /health` | Service health check |

## Development Setup

### Backend
```bash
cd backend
# requires .NET 9 SDK + PostgreSQL + Redis
dotnet run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## License

MIT
