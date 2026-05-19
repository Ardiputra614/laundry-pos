# AGENTS.md — Laundry POS SaaS Platform

## Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) + TypeScript |
| Backend | Go 1.22+ (Gin, GORM) |
| Database | MySQL 8 (tenant-aware via `tenant_id` column on every table, `CHAR(36)` for UUIDs) |
| Cache | Redis 7 |
| Queue | Redis Queue (asynq) |
| Realtime | WebSocket (gorilla/websocket) |
| Payments | Midtrans (snap API) |
| Offline DB | SQLite (expo-sqlite) |
| Storage | S3-compatible (minio client) |
| Auth | JWT + Refresh Token rotation |
| Deploy | Docker + Compose, Nginx reverse proxy |

## Project Structure

```
laundry-project/
├── backend/               # Go monolith (modular by domain)
│   ├── cmd/server/        # Entrypoint (211 lines, 42+ routes)
│   ├── internal/
│   │   ├── domain/        # Entities + repo interfaces
│   │   ├── usecase/       # Business logic
│   │   ├── repository/    # GORM implementations
│   │   ├── handler/       # Gin handlers
│   │   ├── middleware/    # Tenant, auth, RBAC
│   │   ├── dto/           # Request/response schemas
│   │   ├── config/        # Env-based config loader
│   │   ├── pkg/           # jwt, response, database, uploader, websocket
│   │   └── worker/        # Background tasks
│   ├── migrations/        # 6 migration sets (all tables)
│   ├── seeds/
│   └── Dockerfile         # Multi-stage build
├── mobile/                # React Native Expo app
│   ├── app/               # Expo Router routes (auth + app tabs)
│   ├── src/
│   │   ├── types/         # 20+ TS interfaces
│   │   ├── lib/           # API client, SQLite, sync engine, theme
│   │   ├── stores/        # Zustand (auth, order)
│   │   ├── providers/     # Auth context
│   │   └── components/    # 10 reusable UI components
├── docker-compose.yml     # Dev: MySQL + Redis + MinIO + Backend + Nginx
├── docker-compose.prod.yml
├── .github/workflows/     # CI (lint, test, build, docker)
└── infra/                 # nginx, monitoring (prometheus), scripts
```

## Architecture Rules

- **Clean Architecture**: `handler → usecase → repository/domain`. Handlers never call repositories directly.
- **Tenant Isolation**: Every DB query MUST include `WHERE tenant_id = ?`. Tenant ID injected via middleware into `gin.Context`.
- **Modular Monolith**: Each domain is a self-contained package under `internal/`. Domain deps go through usecase interfaces only.
- **Offline-First Mobile**: All writes go to local SQLite first. Sync engine replays queued mutations to API when online. Conflict resolution: last-write-wins + manual merge for financial data.

## Domain Modules (Backend)

| Domain | Files | Routes |
|--------|-------|--------|
| Auth | user, auth handler/usecase | register, login, refresh, logout, profile |
| POS | service, customer, order, payment | full CRUD + status tracking + payment webhook |
| Company Admin | branch, outlet, employee, device | full CRUD per module |
| Subscription | plan, subscription, invoice | plan CRUD, change/cancel, public plan list |
| Superadmin | company mgmt, dashboard, system health | list/suspend/activate companies, stats, health |
| Infrastructure | notification, activity_log, sync_log, websocket, uploader | notifications CRUD, WS hub, S3 upload |

## Key Conventions

- **Models**: GORM models use `tenant_id` (UUID CHAR(36)), `created_at`, `updated_at`, `deleted_at` (soft delete). No cross-tenant queries.
- **Errors**: Custom domain errors in `internal/domain/errors.go`. Handlers map errors to HTTP status codes.
- **API**: RESTful JSON. All responses wrapped in `{"code": int, "message": string, "data": any}`.
- **Auth**: `Authorization: Bearer <access_token>` header. Refresh via `POST /api/v1/auth/refresh`. Token rotation invalidates old refresh tokens.
- **Migrations**: SQL files in `backend/migrations/` — MySQL syntax with `CHAR(36)` UUIDs, `utf8mb4` charset, `InnoDB` engine.

## Development Commands

```bash
# Backend
cd backend
go run cmd/server/main.go              # dev server
go build ./... && go vet ./...         # verify build (always run before commit)
go test ./... -count=1 -race           # all tests with race detection

# Mobile
cd mobile
npx expo start                          # dev client
npx tsc --noEmit                        # type check only

# Docker
docker compose up -d                    # full stack (mysql + redis + minio + backend)
docker compose -f docker-compose.prod.yml up -d

# DB
mysql -u root -p laundry_pos < migrations/000001_create_users.up.sql
```

## Testing

- Backend: standard `testing` + testify. Integration tests need running MySQL + Redis.
- Mobile: Jest + React Native Testing Library.
- Run `go test -count=1 -race ./...` before committing backend changes.
- CI runs lint → test → build → docker in `.github/workflows/ci.yml`.

## Deployment

- Dev: `docker compose up -d`
- Prod: `docker compose -f docker-compose.prod.yml up -d` (requires `.env.prod`)
- SSL termination at Nginx reverse proxy.
- Health check: `GET /health` returns `{"status":"ok"}`.

## Payment (Midtrans)

- Server Key in env, never committed.
- Webhook: `POST /api/v1/payments/webhook` (public, no auth).
- Sandbox: `MIDTRANS_IS_PRODUCTION=false`.

## API Routes (42+ total)

```
GET    /health
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout          [auth]
GET    /api/v1/auth/me              [auth]
GET    /api/v1/profile              [auth]
GET    /api/v1/services             [auth]
POST   /api/v1/services             [auth]
PUT    /api/v1/services/:id         [auth]
GET    /api/v1/services/categories  [auth]
POST   /api/v1/services/categories  [auth]
GET    /api/v1/customers            [auth]
POST   /api/v1/customers            [auth]
GET    /api/v1/customers/:id        [auth]
PUT    /api/v1/customers/:id        [auth]
GET    /api/v1/customers/search/phone [auth]
GET    /api/v1/orders               [auth]
POST   /api/v1/orders               [auth]
GET    /api/v1/orders/:id           [auth]
PUT    /api/v1/orders/:id/status    [auth]
POST   /api/v1/orders/:id/payment   [auth]
GET    /api/v1/branches             [auth]
POST   /api/v1/branches             [auth]
GET    /api/v1/outlets              [auth]
POST   /api/v1/outlets              [auth]
GET    /api/v1/employees            [auth]
POST   /api/v1/employees            [auth]
POST   /api/v1/devices/register     [auth]
GET    /api/v1/devices              [auth]
GET    /api/v1/notifications        [auth]
GET    /api/v1/subscription         [auth]
GET    /api/v1/plans                [public]
POST   /api/v1/payments/webhook     [public]
GET    /api/v1/ws                   [auth, websocket]
GET    /api/v1/superadmin/*         [superadmin]
```
