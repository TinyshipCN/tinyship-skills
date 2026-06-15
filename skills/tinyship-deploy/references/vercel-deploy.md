# Vercel Deployment

Best suited for the Next.js app.

## Steps

1. Push your TinyShip project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the project
3. Configure:
   - **Root Directory**: `apps/next-app`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: leave default
   - **Install Command**: `pnpm install`
4. Add all environment variables from your `.env` file
5. Click Deploy

## Important Settings

- Ensure `APP_BASE_URL` is set to your Vercel domain (e.g., `https://your-app.vercel.app`)
- Ensure `BETTER_AUTH_URL` matches `APP_BASE_URL`
- If using a custom domain, update after adding it in Vercel

## Database

Vercel Postgres or any external PostgreSQL service works. Options:
- Vercel Postgres (integrated)
- Supabase (free tier available)
- Neon (serverless Postgres)
- Any cloud PostgreSQL service

## Reference

- TinyShip docs: `docs/user-guide/deployment/cloud.md`
- [Vercel deployment docs](https://vercel.com/docs)
