# CracknCode AI

Production-ready AI SaaS platform monorepo.

## Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind, shadcn/ui |
| Backend    | NestJS, TypeScript                      |
| Database   | PostgreSQL + Prisma ORM                 |
| Cache/Queue| Redis + BullMQ                          |
| Realtime   | Socket.IO                               |
| AI         | OpenAI API (multi-provider ready)       |
| Payments   | Stripe                                  |
| Storage    | S3-compatible                           |

## Project Structure

```
crackncode-ai/
├── apps/
│   ├── web/          # Next.js frontend  (port 3000)
│   └── api/          # NestJS backend    (port 4000)
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── config/       # Shared ESLint + TS configs
│   └── ui/           # Shared UI components (shadcn/ui)
├── turbo.json
└── package.json
```

## Prerequisites

- Node.js >= 20
- npm >= 10
- PostgreSQL (local or Docker)
- Redis (local or Docker)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` with your PostgreSQL and Redis credentials.

### 3. Start infrastructure (Docker)

```bash
docker compose up -d
```

### 4. Run database migrations

```bash
cd apps/api
npx prisma migrate dev --name init
```

### 5. Start development servers

```bash
# From root — starts both frontend and backend
npm run dev
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:4000/api/v1
- Status page: http://localhost:3000/status
- Health endpoint: http://localhost:4000/api/v1/health

## Scripts

| Command           | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start all apps in dev mode         |
| `npm run build`   | Build all apps for production      |
| `npm run lint`    | Lint all packages                  |
| `npm run format`  | Format all files with Prettier     |
| `npm run type-check` | TypeScript check across all packages |
| `npm run clean`   | Remove all build artifacts         |

## Health Check

```bash
curl http://localhost:4000/api/v1/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "uptime": 42,
    "services": {
      "database": { "status": "ok", "message": "stub — not connected yet" },
      "redis":    { "status": "ok", "message": "stub — not connected yet" },
      "storage":  { "status": "ok", "message": "stub — not connected yet" }
    }
  }
}
```
