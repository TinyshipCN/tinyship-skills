---
name: tinyship-brand
description: >-
  Customize TinyShip branding: app name, logo, color theme, and i18n defaults.
  Use when the user asks to "change app name", "customize brand", "change logo",
  "switch theme", "change default language", "rebrand", or "customize appearance".
---

# TinyShip Brand Customization

Guide for rebranding a TinyShip project with custom name, logo, theme, and language settings.

## Step 1: App Name

Edit `config.ts` in the project root:

```typescript
export const config = {
  app: {
    name: 'YourAppName',  // was 'TinyShip'
```

This name appears in page titles, the navbar, email templates, and throughout the UI.

## Step 2: Logo

TinyShip supports two logo modes:

### Mode A: Icon + Text (default)

1. Prepare a square icon (recommended: 24x24px SVG, white fill for colored backgrounds)
2. Place the file in the `public/` folder of the active app (e.g., `apps/next-app/public/logo.svg`)
3. Also place in `apps/docs-app/public/` if the docs app exists
4. Update `config.ts`:

```typescript
logo: {
  iconUrl: '/my-logo.svg',
  fullLogoUrl: '',
  iconClassName: 'bg-blue-500 rounded-full p-1',
}
```

### Mode B: Full Logo Image

1. Prepare a wide logo image (recommended: 200x40px PNG/SVG)
2. Place in the active app's `public/` folder
3. Update `config.ts`:

```typescript
logo: {
  iconUrl: '/my-icon.svg',
  fullLogoUrl: '/my-full-logo.png',
  iconClassName: '',
}
```

## Step 3: Color Theme

TinyShip includes 5 built-in color schemes:

| Scheme | Style |
|--------|-------|
| `default` | Classic gray with blue-purple gradient |
| `claude` | Warm orange tones |
| `cosmic-night` | Deep purple, cosmic |
| `modern-minimal` | Purple-blue minimalist |
| `ocean-breeze` | Fresh teal-green |

Update `config.ts`:

```typescript
theme: {
  defaultTheme: 'light',           // 'light' or 'dark'
  defaultColorScheme: 'claude',    // pick from table above
  storageKey: 'yourapp-ui-theme'   // change to avoid conflicts
}
```

### Custom Theme

For a fully custom color scheme:

1. Visit [tweakcn.com/editor/theme](https://tweakcn.com/editor/theme)
2. Design your theme visually
3. Export the CSS
4. Create a new file in `libs/ui/styles/themes/` (e.g., `my-theme.css`)
5. Add the exported CSS with a class selector (e.g., `.theme-my-theme`)
6. Register the theme in the theme configuration

Read `libs/ui/AGENTS.md` for theme system details.

## Step 4: Default Language

Update `config.ts`:

```typescript
i18n: {
  defaultLocale: 'en',        // 'en' or 'zh-CN'
  locales: ['en', 'zh-CN'],
  cookieKey: 'NEXT_LOCALE',
  autoDetect: false            // set true to detect browser language
}
```

## Step 5: Verify

1. Start the dev server and check:
   - Navbar shows new name/logo
   - Theme colors are applied
   - Default language is correct
2. Toggle dark mode to verify theme works in both modes
3. Switch language to verify i18n still works

## Reference Files in TinyShip Repo

- `config.ts` — main configuration file to edit
- `docs/user-guide/basic-config.md` — detailed branding documentation
- `libs/ui/styles/themes/` — theme CSS files
- `libs/ui/AGENTS.md` — theme system architecture
