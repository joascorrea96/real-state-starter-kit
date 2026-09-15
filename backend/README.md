# Backend Core — Shared foundation for every vertical

## What's already built

- **Core.Domain**: base entities (`BaseEntity`, `TenantEntity`), `Company`,
  `User` (roles: SuperAdmin/CompanyAdmin/Employee/EndUser), and a generic
  `Customer` entity.
- **Core.Application**: `GenericService<T>` with CRUD + pagination + search
  + sorting + dynamic filters, ready to be reused by any module.
- **Core.Infrastructure**: `AppDbContext` (PostgreSQL via Npgsql, with an
  automatic global soft-delete filter) and `GenericRepository<T>`.
- **Api**: ASP.NET Core Web API with JWT authentication, Swagger (with
  Bearer auth support), CORS ready for the Angular apps, and a
  `CustomersController` that serves as the reference pattern for every
  future vertical controller (Properties, Products, Members...).
- **Modules.RealState**: the first complete vertical, proving the whole
  pattern end-to-end — `Property` entity, `PropertyService` (custom
  search across title/description/neighborhood/city, and filters for
  price range, property type, listing type, city, neighborhood, min
  bedrooms), and `PropertiesController` in the Api project.

## The pattern to replicate for every new vertical (Gym, Restaurants, Commercial...)

1. New project `Modules.<Vertical>`, referencing only `Core.Domain` and
   `Core.Application` (never `Core.Infrastructure` or `Api` directly).
2. `Entities/<Pillar>.cs` inheriting `TenantEntity`.
3. `Persistence/<Pillar>Configuration.cs` implementing
   `IEntityTypeConfiguration<T>` — picked up automatically by
   `AppDbContext`, no change needed in Core.Infrastructure.
4. `Services/<Pillar>Service.cs` inheriting `GenericService<T>`,
   overriding `ApplySearch`/`ApplyCustomFilters` only if this vertical
   needs something beyond plain CRUD + pagination.
5. In the `Api` project: add a project reference, a
   `<Pillar>sController` copying `PropertiesController`'s shape, and (only
   if step 4 added a custom service) one line in `Program.cs`:
   `builder.Services.AddScoped<IGenericService<Pillar>, PillarService>();`

## Running it locally

1. Set up a free PostgreSQL database (Supabase or Neon) or run Postgres
   locally via Docker, and update `ConnectionStrings:DefaultConnection` in
   `appsettings.json` (or better, in User Secrets — see step 3).
2. `dotnet restore` at the solution root.
3. Set the JWT signing key outside of `appsettings.json` so it's never
   committed:
   ```
   cd src/Api
   dotnet user-secrets set "Jwt:Key" "some-long-random-string-at-least-32-chars"
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your-real-connection-string"
   ```
4. Create and apply the first migration:
   ```
   dotnet ef migrations add InitialCreate --project src/Core.Infrastructure --startup-project src/Api
   dotnet ef database update --project src/Core.Infrastructure --startup-project src/Api
   ```
   (requires the EF Core CLI tool: `dotnet tool install --global dotnet-ef`)
5. `dotnet run --project src/Api` and open `/swagger` to try the endpoints.
6. `POST /api/auth/login` needs a `User` row to exist first with a
   BCrypt-hashed password — easiest way for now is inserting one manually
   via the `PasswordHasher.Hash(...)` helper, until a seed/registration
   endpoint is built.

## Naming reference (Portuguese → English)

If you already sketched anything using the earlier Portuguese names, here's
the mapping used going forward:

| Before (PT-BR) | Now (EN) |
|---|---|
| Empresa | Company |
| Usuario | User |
| Cliente | Customer |
| EmpresaId | CompanyId |
| PerfilUsuario | UserRole |
| RazaoSocial / NomeFantasia | LegalName / TradeName |

## How this fits your existing folders (gym, real-state, restaurants...)

Suggested layout on your C: drive:

```
C:\web-systems\
├── backend\                  <- what was just created
│   ├── WebSystems.sln
│   └── src\
│       ├── Core.Domain\
│       ├── Core.Application\
│       ├── Core.Infrastructure\
│       ├── Modules.Gym\          <- next step
│       ├── Modules.RealState\
│       ├── Modules.Restaurants\
│       ├── Modules.Commercial\
│       └── Api\                  <- single API, exposes the endpoints
└── frontend\
    ├── apps\gym\
    ├── apps\real-state\
    ├── apps\restaurants\
    ├── apps\commercial\
    ├── apps\others\
    └── libs\core-ui\ core-auth\ core-data\
```

Your current folders (gym, real-state...) become **modules** inside this
monorepo, not separate from-scratch projects. That's what keeps the cost
at zero (one API, one database) and reuses ~80% of the code.

## Suggested next steps

1. `dotnet restore` on the solution (downloads NuGet packages — only step
   that needs internet, still free).
2. Create the `Api` project (ASP.NET Core Web API) referencing the 3 Core
   projects, with `Program.cs`, JWT auth and Swagger.
3. Create `Modules.RealState` as the first vertical: a `Property` entity
   inheriting `TenantEntity`, `PropertyService : GenericService<Property>`
   overriding `ApplySearch`/`ApplyCustomFilters` (neighborhood, price, type).
4. Set up the Angular workspace with Nx and a `core-ui` lib with the
   table/pagination component that consumes the backend's `PagedResult<T>`.
5. Set up the free database (Supabase or Neon) and run the first migration.

Let me know which of these to tackle next.
