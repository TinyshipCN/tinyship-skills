# R2 Storage Setup

TinyShip uses Cloudflare R2 in two different ways, depending on the template.
Detect the current project first (see the skill's Step 0), then follow only the
matching section.

- **tinyship-cf** — native Workers `R2_BUCKET` binding. Do **not** create R2 API
  tokens or set `R2_ACCESS_KEY_ID` / `R2_ACCESS_KEY_SECRET`.
- **shipeasy** — S3-compatible HTTP API (no Workers binding), so the same
  credentials work on Next.js, Nuxt, and TanStack / Workers.

---

## tinyship-cf (native binding)

The template already declares the binding in `apps/tanstack-app/wrangler.jsonc`:

```jsonc
"r2_buckets": [{
  "binding": "R2_BUCKET",
  "bucket_name": "tinyship"
}]
```

Uploads go through the binding (`getR2Bucket(context)` in
`apps/tanstack-app/src/routes/api/upload.ts`). Public URLs are
`{R2_PUBLIC_URL}/{key}`. There is no S3 client and no access-key secret.

### 1. Create the bucket (if it does not exist)

```bash
cd apps/tanstack-app
npx wrangler r2 bucket create tinyship
```

If the user already has a bucket, set `bucket_name` in `wrangler.jsonc` to that
name. The binding name must stay `R2_BUCKET`.

### 2. Set a public URL

Production uploads require a real HTTPS custom domain on the bucket (Dashboard
→ R2 → bucket → Settings → Custom Domains). Placeholder hosts such as
`example.com` are rejected before upload.

Add it to `apps/tanstack-app/.dev.vars` for local wrangler / preview:

```env
R2_PUBLIC_URL=https://static.yourdomain.com
```

And to `wrangler.jsonc` `vars` for deployment (this value is not a secret):

```jsonc
"vars": {
  "R2_PUBLIC_URL": "https://static.yourdomain.com"
}
```

Do not run `wrangler secret put R2_ACCESS_KEY_ID` or
`wrangler secret put R2_ACCESS_KEY_SECRET`.

### 3. Verify

```bash
# From the monorepo root
pnpm dev   # http://localhost:7001 — local R2 is emulated under .wrangler/state/
```

Upload a file from the app UI (typically `/{lang}/upload`). In local dev, files
appear in the wrangler R2 emulation, not necessarily in the remote dashboard.
After `pnpm deploy:cf`, check the real bucket in the Cloudflare Dashboard and
open the object via `R2_PUBLIC_URL`.

---

## shipeasy (S3-compatible API)

Cloudflare R2 is S3-compatible object storage. In this template TinyShip uses
the S3 HTTP API (not Workers bindings), so R2 works across all three apps —
not just Workers.

### 1. Create R2 Bucket

In the Cloudflare Dashboard:

1. Go to **R2 Object Storage** → **Create bucket**
2. Name it (e.g., `tinyship`) — this becomes the `R2_BUCKET` value
3. Choose a location hint (optional)

Or via CLI:

```bash
npx wrangler r2 bucket create tinyship
```

### 2. Create R2 API Token

R2 uses separate S3-compatible credentials (not `CLOUDFLARE_API_TOKEN`):

1. Go to **R2 Object Storage** → **Manage R2 API tokens**
2. Click **Create API token**
3. Permissions: **Object Read & Write**
4. Specify the bucket (or all buckets)
5. Save the **Access Key ID** and **Secret Access Key**

### 3. Configure Environment Variables

Add to your `.env` (monorepo root):

```env
STORAGE_PROVIDER=r2
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<r2-api-token-access-key-id>
R2_ACCESS_KEY_SECRET=<r2-api-token-secret-access-key>
R2_BUCKET=tinyship
```

The `CLOUDFLARE_ACCOUNT_ID` is shared with Email Sending — if already set, no need
to add it again.

#### Optional: Public URL

If you set up a custom domain for your R2 bucket (Dashboard → R2 → bucket → Settings
→ Custom Domains), add:

```env
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

This enables permanent public URLs instead of time-limited signed URLs.

### 4. For Workers Deployment

When deploying shipeasy to Workers, add R2 credentials as secrets:

```bash
cd apps/tanstack-app
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_ACCESS_KEY_SECRET
npx wrangler secret put R2_BUCKET
```

Or set them in `wrangler.jsonc` `vars` (for non-sensitive values like bucket name):

```jsonc
"vars": {
  "STORAGE_PROVIDER": "r2",
  "R2_BUCKET": "tinyship"
}
```

### 5. Verify

Test the upload endpoint:

```bash
# Start the app
pnpm dev  # or pnpm dev:cf for Workers mode

# Try uploading via the UI at http://localhost:7001/{lang}/upload
```

Check that files appear in your R2 bucket in the Cloudflare Dashboard.

### How It Works

R2 is accessed via S3-compatible HTTP API in `libs/storage/providers/s3.ts`:

```
Endpoint: https://{accountId}.r2.cloudflarestorage.com
Region: auto
ForcePathStyle: true
```

The `createR2Provider()` function builds an S3 client pointed at R2's endpoint.
No Workers bindings are used — this works identically on Node.js and Workers
in the shipeasy template.
