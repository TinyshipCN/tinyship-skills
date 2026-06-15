# Framework Cleanup Procedure

When the user chooses to keep only one framework, follow this procedure to thoroughly
remove the other two.

## Determine What to Remove

Based on the user's chosen framework:

| Keeping | Remove apps | Also remove |
|---------|------------|-------------|
| **Next.js** | `apps/nuxt-app`, `apps/tanstack-app` | — |
| **Nuxt.js** | `apps/next-app`, `apps/tanstack-app` | `libs/react-shared` (React-only) |
| **TanStack Start** | `apps/next-app`, `apps/nuxt-app` | — |

## Cleanup Steps

Execute all steps in order. After each file edit, verify the change is correct.

### 1. Delete app directories

```bash
# Example: keeping Next.js
rm -rf apps/nuxt-app apps/tanstack-app

# Example: keeping Nuxt.js (also remove React shared lib)
rm -rf apps/next-app apps/tanstack-app libs/react-shared

# Example: keeping TanStack Start
rm -rf apps/next-app apps/nuxt-app
```

### 2. Update pnpm-workspace.yaml

Remove the deleted app entries. Only keep the remaining app and `packages/*`:

```yaml
packages:
  - "apps/next-app"    # keep only the chosen one
  - "packages/*"
```

### 3. Update turbo.json

Remove pipeline entries that reference deleted apps. Look for filter patterns
like `@tinyship/nuxt-app` or `@tinyship/tanstack-app` and remove them.

### 4. Update root package.json scripts

Remove dev/build/typecheck scripts for deleted apps:

- If removing Next: delete `dev:next`, `build:next`, scripts with `--filter @tinyship/next-app`
- If removing Nuxt: delete `dev:nuxt`, `build:nuxt`, scripts with `--filter @tinyship/nuxt-app`
- If removing TanStack: delete `dev:tanstack`, `build:tanstack`, scripts with `--filter @tinyship/tanstack-app`

Keep the remaining app's scripts. Consider renaming `dev:next` to just `dev` for simplicity.

### 5. Update docker-compose.yml

Remove service definitions and profiles for deleted apps. Each app has its own
service block and Docker profile (`--profile next`, `--profile nuxt`, `--profile tanstack`).

### 6. Update .github/workflows/ci.yml

Remove build and verify jobs for deleted apps. The CI workflow has separate jobs
for each app's typecheck, build, and Docker verification.

### 7. Update root AGENTS.md

Edit the `AGENTS.md` file to:
- Update the "Scope" section to only list the remaining app
- Remove references to deleted frameworks throughout
- Simplify the "Feature Parity Matrix" section (no longer multi-framework)
- Update verification commands to only reference the remaining app

### 8. Clean up and verify

```bash
# Reinstall to clean up lockfile
pnpm install

# Run typecheck on remaining app (replace with actual app filter)
pnpm --filter @tinyship/next-app typecheck

# Run build on remaining app
pnpm --filter @tinyship/next-app build
```

If both pass, the cleanup is complete.

### 9. Optional: simplify docs-app references

If the user also wants to simplify the docs site (`apps/docs-app`), remove
documentation pages that reference the deleted frameworks. This is optional
since the docs can serve as reference material.
