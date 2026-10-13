#!/usr/bin/env bash
# Re-run the recipe migration on local D1 (idempotency). `migrations apply` skips
# applied files, so execute the SQL directly. usage (repo root): scripts/recipes/directory/d1-reapply.sh
set -euo pipefail
F=$(ls libs/database/drizzle-sqlite/*_recipe_directory_v1.sql)
cd apps/tanstack-app && npx wrangler d1 execute tinyship-db --local --file "../../$F"
