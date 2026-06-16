# R2 Storage Setup

Cloudflare R2 is S3-compatible object storage. TinyShip uses the S3 HTTP API
(not Workers bindings), so R2 works across all three apps — not just Workers.

## 1. Create R2 Bucket

In the Cloudflare Dashboard:

1. Go to **R2 Object Storage** → **Create bucket**
2. Name it (e.g., `tinyship`) — this becomes the `R2_BUCKET` value
3. Choose a location hint (optional)

Or via CLI:

```bash
npx wrangler r2 bucket create tinyship
```

## 2. Create R2 API Token

R2 uses separate S3-compatible credentials (not `CLOUDFLARE_API_TOKEN`):

1. Go to **R2 Object Storage** → **Manage R2 API tokens**
2. Click **Create API token**
3. Permissions: **Object Read & Write**
4. Specify the bucket (or all buckets)
5. Save the **Access Key ID** and **Secret Access Key**

## 3. Configure Environment Variables

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

### Optional: Public URL

If you set up a custom domain for your R2 bucket (Dashboard → R2 → bucket → Settings
→ Custom Domains), add:

```env
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

This enables permanent public URLs instead of time-limited signed URLs.

## 4. For Workers Deployment

When deploying to Workers, add R2 credentials as secrets:

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

## 5. Verify

Test the upload endpoint:

```bash
# Start the app
pnpm dev  # or pnpm dev:cf for Workers mode

# Try uploading via the UI at http://localhost:7001/{lang}/upload
```

Check that files appear in your R2 bucket in the Cloudflare Dashboard.

## How It Works

R2 is accessed via S3-compatible HTTP API in `libs/storage/providers/s3.ts`:

```
Endpoint: https://{accountId}.r2.cloudflarestorage.com
Region: auto
ForcePathStyle: true
```

The `createR2Provider()` function builds an S3 client pointed at R2's endpoint.
No Workers bindings are used — this works identically on Node.js and Workers.
