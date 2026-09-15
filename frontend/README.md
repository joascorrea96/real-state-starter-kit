# Frontend — Angular workspace (multi-app, shared libs)

Native Angular CLI multi-project workspace (no Nx — lighter, same result:
several apps in one repo sharing code through TypeScript path aliases).

## Structure

```
frontend/
├── libs/
│   ├── core-data/   # models mirroring backend DTOs + GenericApiService
│   ├── core-auth/   # AuthService, authGuard, authInterceptor
│   └── core-ui/     # ws-data-table, ws-pagination-bar, ws-search-filter-bar,
│                     # ws-badge — design tokens in styles/_tokens.scss
└── apps/
    └── real-state/  # first vertical app, consuming everything above
```

Path aliases (`tsconfig.json`): `@web-systems/core-data`,
`@web-systems/core-auth`, `@web-systems/core-ui` — resolve straight to each
lib's `src/index.ts`, no build/publish step needed since everything compiles
together as part of the app.

## Running

```
npm install
npm start          # ng serve real-state, http://localhost:4200
npm run build       # ng build real-state
npm run build:prod  # production build
```

Set the API URL in `apps/real-state/src/environments/environment.ts`
(dev) and `environment.production.ts` (prod build).

## Adding a new vertical app (Gym, Restaurants, Commercial...)

1. Copy `apps/real-state` to `apps/<vertical>`, add a matching entry
   under `projects` in `angular.json` (root/sourceRoot/outputPath
   updated), and a `start:<vertical>` / `build:<vertical>` script in
   `package.json`.
2. Reuse `core-ui`/`core-data`/`core-auth` as-is.
3. Add whatever vertical-specific models/services live only in that app
   (e.g. a `MemberService` for Gym) — or promote them into a new
   `libs/module-gym` lib if more than one app ends up needing them.

## White-labeling

`core-ui/src/styles/_tokens.scss` defines CSS custom properties
(`--color-accent`, etc.). Per-company overrides (from `Company.settingsJson`
on the backend) can be applied at runtime by setting these same custom
properties on `:root` from the app shell, without touching component code.
