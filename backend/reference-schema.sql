-- Reference schema — this is what `dotnet ef database update` generates
-- automatically from the C# entities. You do NOT need to run this by
-- hand if you use the migration (recommended). Kept here only so you can
-- inspect the exact structure, or run it manually via DBeaver as a
-- fallback if you'd rather skip the EF CLI entirely.
--
-- Note: Postgres identifiers here are quoted ("Id", "CreatedAt"...)
-- because Npgsql/EF Core preserves the exact C# PascalCase names.
-- Unquoted identifiers in Postgres get lowercased automatically, so if
-- you type these without quotes, they won't match what EF Core expects.

CREATE TABLE "Companies" (
    "Id" uuid PRIMARY KEY,
    "LegalName" varchar NOT NULL,
    "TradeName" varchar NOT NULL,
    "TaxId" varchar NULL,
    "Email" varchar NOT NULL,
    "Phone" varchar NULL,
    "Vertical" varchar NOT NULL,
    "SettingsJson" text NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamptz NOT NULL,
    "UpdatedAt" timestamptz NULL,
    "IsDeleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE "Users" (
    "Id" uuid PRIMARY KEY,
    "CompanyId" uuid NOT NULL REFERENCES "Companies" ("Id") ON DELETE RESTRICT,
    "Name" varchar NOT NULL,
    "Email" varchar NOT NULL,
    "PasswordHash" varchar NOT NULL,
    "Role" integer NOT NULL,           -- enum stored as int: 0=SuperAdmin,1=CompanyAdmin,2=Employee,3=EndUser
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamptz NOT NULL,
    "UpdatedAt" timestamptz NULL,
    "IsDeleted" boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");
CREATE INDEX "IX_Users_CompanyId" ON "Users" ("CompanyId");

CREATE TABLE "Customers" (
    "Id" uuid PRIMARY KEY,
    "CompanyId" uuid NOT NULL,          -- no DB-level FK by design (see note below)
    "Name" varchar NOT NULL,
    "Email" varchar NULL,
    "Phone" varchar NULL,
    "TaxId" varchar NULL,
    "Address" varchar NULL,
    "City" varchar NULL,
    "State" varchar NULL,
    "ZipCode" varchar NULL,
    "Notes" text NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamptz NOT NULL,
    "UpdatedAt" timestamptz NULL,
    "IsDeleted" boolean NOT NULL DEFAULT false
);
CREATE INDEX "IX_Customers_CompanyId" ON "Customers" ("CompanyId");

CREATE TABLE "Properties" (
    "Id" uuid PRIMARY KEY,
    "CompanyId" uuid NOT NULL,
    "Title" varchar(200) NOT NULL,
    "Description" text NULL,
    "Type" integer NOT NULL,           -- enum: 0=House,1=Apartment,2=Land,3=Commercial,4=Farm
    "ListingType" integer NOT NULL,    -- enum: 0=ForSale,1=ForRent
    "Price" numeric(14,2) NOT NULL,
    "CondoFee" numeric(14,2) NULL,
    "Bedrooms" integer NOT NULL,
    "Bathrooms" integer NOT NULL,
    "ParkingSpots" integer NOT NULL,
    "AreaSqm" numeric(10,2) NOT NULL,
    "Address" varchar NOT NULL,
    "Neighborhood" varchar NOT NULL,
    "City" varchar NOT NULL,
    "State" varchar NOT NULL,
    "ZipCode" varchar NULL,
    "ImageUrls" text[] NULL,           -- native Postgres array
    "IsActive" boolean NOT NULL DEFAULT true,
    "IsFeatured" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamptz NOT NULL,
    "UpdatedAt" timestamptz NULL,
    "IsDeleted" boolean NOT NULL DEFAULT false
);
CREATE INDEX "IX_Properties_CompanyId" ON "Properties" ("CompanyId");
CREATE INDEX "IX_Properties_City" ON "Properties" ("City");
CREATE INDEX "IX_Properties_Neighborhood" ON "Properties" ("Neighborhood");
CREATE INDEX "IX_Properties_Price" ON "Properties" ("Price");
CREATE INDEX "IX_Properties_Type" ON "Properties" ("Type");

-- Note on Customers.CompanyId: unlike Users, Customer has no navigation
-- property back to Company in the C# code, so EF Core doesn't create a
-- DB-level foreign key for it — CompanyId is just scoped in application
-- logic (GenericService always filters by it). This is intentional and
-- matches the current AppDbContext configuration exactly.
