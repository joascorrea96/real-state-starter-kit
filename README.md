# Web Systems — Vertical SaaS starter kits

Zero-cost starter platform for selling ready-made web systems to small/regional
businesses (gyms, real estate agencies, restaurants, shops...). See
`backend/README.md` and `frontend/README.md` for details on each side.

## Quick start

**1. Backend (.NET 9 API)**

```
cd backend
dotnet restore
dotnet user-secrets set "Jwt:Key" "some-long-random-string-at-least-32-chars" --project src/Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your-postgres-connection-string" --project src/Api
```

⚠️ **The model changed since your last migration** (added `Company.Slug`
and the whole `Lead` entity for lead capture). Generate a fresh migration
before running:

```
dotnet ef migrations add AddSlugAndLeads --project src/Core.Infrastructure --startup-project src/Api
dotnet ef database update --project src/Core.Infrastructure --startup-project src/Api
dotnet run --project src/Api
```

API runs at `http://localhost:5000` (see `src/Api/Properties/launchSettings.json`),
opens Swagger automatically at `/swagger`.

On first run in Development, a **demo Company + admin user + 15 sample
properties are seeded automatically** (see `src/Api/Data/DevelopmentDataSeeder.cs`):

```
email:    admin@demo.com
password: Demo123!
company slug: demo-imoveis
```

Remove or replace that seeder before this ever goes to production.

**2. Frontend — two separate apps now**

```
cd frontend
npm install
```

- **Admin panel** (`apps/real-state`, port 4200) — where the company's
  staff logs in to manage properties and leads:
  ```
  npm start
  ```
- **Public site** (`apps/real-state-public`, port 4300) — the catalog
  visitors browse, no login. Scoped to one company via
  `environment.ts`'s `companySlug` (defaults to `demo-imoveis` to match
  the seeder):
  ```
  npm run start:public
  ```

**3. End-to-end test**

1. Open `http://localhost:4300` (public site) — you should see the 15
   seeded properties, with working search/filters/sort/pagination.
2. Open a property, fill in the "Tenho interesse" form, submit.
3. Open `http://localhost:4200` (admin), log in with `admin@demo.com` /
   `Demo123!`, go to **Leads** — the submission from step 2 should be
   there.
4. Back on `/properties` in the admin, create/edit a property — refresh
   the public site and confirm it shows up (or updates) instantly, no
   delay (this is the whole point of the public site sharing the same
   database instead of a portal-style XML/sync).

**Verified in this environment**: `ng build` passed for both frontend
apps here. The backend compiles per your own confirmation — `dotnet ef
migrations add` / `database update` for this new migration and the full
end-to-end flow above still need to run on your machine.

## What exists today

- **Core** (backend): shared entities, generic CRUD + pagination/search/sort,
  JWT auth, multi-tenant scoping by `CompanyId`.
- **Core** (frontend): `core-data` (models + generic HTTP client),
  `core-auth` (login, guard, interceptor), `core-ui` (data table, pagination
  bar, search/filter bar, badge — all theme-able via CSS variables for
  white-labeling).
- **First complete vertical**: RealState — `Property` entity/service/API on
  the backend, `PropertiesListComponent` (search + filters + sortable table +
  pagination) on the frontend, wired end-to-end.

## Next verticals (Gym, Restaurants, Commercial)

Follow the exact same recipe documented in `backend/README.md` (module
pattern) and mirror `apps/real-state` as `apps/gym`, `apps/restaurants`, etc.
in `frontend/angular.json` — each new app reuses `core-data`, `core-auth` and
`core-ui` without duplicating any of that code.
