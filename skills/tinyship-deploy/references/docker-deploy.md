# Docker Deployment

## Using Docker Compose (Recommended)

TinyShip includes a `docker-compose.yml` with profile-based container selection.

```bash
# Build and start Next.js app
docker compose --profile next up -d

# Or Nuxt.js
docker compose --profile nuxt up -d

# Or TanStack Start
docker compose --profile tanstack up -d
```

## Environment Variables

Create a `.env` file in the project root with production values before building.
Docker Compose will automatically use it.

Key variables to set for production:
- `APP_BASE_URL` — your production URL
- `DATABASE_URL` — production PostgreSQL connection
- `BETTER_AUTH_SECRET` — strong random secret
- All payment webhook URLs updated to production domain

## Building Individual Images

Each app has its own Dockerfile:

```bash
# Build from project root (needed for monorepo context)
docker build -f apps/next-app/Dockerfile -t tinyship-next .
docker build -f apps/nuxt-app/Dockerfile -t tinyship-nuxt .
docker build -f apps/tanstack-app/Dockerfile -t tinyship-tanstack .

# Run
docker run -p 7001:7001 --env-file .env tinyship-next
```

## Health Check

All apps expose `GET /api/health` for container health checks.

## Reference

- TinyShip docs: `docs/user-guide/deployment/docker.md`
- `docker-compose.yml` in project root
