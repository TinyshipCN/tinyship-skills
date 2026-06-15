# Framework Cleanup Procedure

**Prerequisites:** The user has already chosen a framework in Step 3 and explicitly
confirmed they want to remove the others in Step 4.

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

If the workspace file uses an `apps/*` wildcard glob, no changes are needed — the
deleted directories are automatically excluded.

If it lists apps explicitly, remove the deleted app entries:

```yaml
packages:
  - "apps/next-app"    # keep only the chosen one
  - "packages/*"
```

### 3. Update turbo.json

Remove output patterns that only apply to deleted frameworks:
- If removing Nuxt: remove `.nuxt/**` and `.output/**` from build outputs
- If removing Next: remove `.next/**` from build outputs
- If removing TanStack: remove `dist/**` from build outputs (if only used by TanStack)

### 4. Update root package.json scripts

Remove dev/build/start/typecheck scripts for deleted apps:

- If removing Next: delete `dev:next`, `build:next`, `start:next`, `typecheck:next`, and scripts with `--filter @tinyship/next-app`
- If removing Nuxt: delete `dev:nuxt`, `build:nuxt`, `start:nuxt`, `typecheck:nuxt`, and scripts with `--filter @tinyship/nuxt-app`
- If removing TanStack: delete `dev:tanstack`, `build:tanstack`, `start:tanstack`, `typecheck:tanstack`, and scripts with `--filter @tinyship/tanstack-app`

**Rename the remaining app's scripts for simplicity:**
- `dev:next` → `dev`
- `build:next` → `build`
- `start:next` → `start`
- `typecheck:next` → `typecheck`

(Same pattern for whichever framework is kept.)

### 5. Update docker-compose.yml

Remove service definitions and profiles for deleted apps. Each app has its own
service block and Docker profile (`--profile next`, `--profile nuxt`, `--profile tanstack`).

With only one app remaining, the profile system is no longer needed — remove
the `profiles:` key from the remaining service so it starts by default.

### 6. Update .github/workflows/ci.yml

Remove build steps and Docker build verification for deleted apps. The CI workflow
has separate steps for each app's build and Docker image verification.

Update the remaining build step to use the simplified script name (e.g., `pnpm build`
instead of `pnpm build:next`).

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

# Run typecheck on remaining app
pnpm typecheck

# Run build on remaining app
pnpm build
```

If both pass, the cleanup is complete. Tell the user the results.

### 9. Optional: simplify docs-app references

Ask the user if they also want to simplify the docs site (`apps/docs-app`) by
removing documentation pages that reference the deleted frameworks. This is optional
since the docs can serve as reference material.
