using Api.Auth;
using Core.Domain.Entities;
using Core.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Modules.RealState.Entities;

namespace Api.Data;

/// <summary>
/// Development-only convenience: creates one Company + one CompanyAdmin
/// user on first run, so there's something to log in with immediately
/// after `dotnet ef database update`, without a manual INSERT or a
/// registration endpoint (not built yet — every vertical currently
/// starts from a contract you set up by hand for the client, so this is
/// just for local testing, not a real onboarding flow). Also seeds a
/// batch of sample properties so the RealState list/search/filter/sort
/// UI has real data to exercise.
/// </summary>
public static class DevelopmentDataSeeder
{
    public const string SeedAdminEmail = "admin@demo.com";
    public const string SeedAdminPassword = "Demo123!";

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var company = await SeedCompanyAndAdminAsync(context, passwordHasher);
        await SeedSamplePropertiesAsync(context, company.Id);
    }

    /// <summary>
    /// Independent of property seeding below: returns the existing
    /// company if one is already there, or creates the demo company +
    /// admin user on first run.
    /// </summary>
    private static async Task<Company> SeedCompanyAndAdminAsync(AppDbContext context, IPasswordHasher passwordHasher)
    {
        var existing = await context.Companies.FirstOrDefaultAsync();
        if (existing is not null)
            return existing;

        var company = new Company
        {
            LegalName = "Demo Real Estate Ltda",
            TradeName = "Demo Imóveis",
            Slug = "demo-imoveis",
            Email = "contato@demoimoveis.com.br",
            Phone = "5521999999999",
            Vertical = "RealState",
            IsActive = true
        };
        context.Companies.Add(company);

        var adminUser = new User
        {
            CompanyId = company.Id,
            Name = "Admin Demo",
            Email = SeedAdminEmail,
            PasswordHash = passwordHasher.Hash(SeedAdminPassword),
            Role = UserRole.CompanyAdmin,
            IsActive = true
        };
        context.Users.Add(adminUser);

        await context.SaveChangesAsync();

        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("=====================================================");
        Console.WriteLine(" Seeded demo login for local testing:");
        Console.WriteLine($"   email:    {SeedAdminEmail}");
        Console.WriteLine($"   password: {SeedAdminPassword}");
        Console.WriteLine(" Change or remove this seeder before going to production.");
        Console.WriteLine("=====================================================");
        Console.ResetColor();

        return company;
    }

    /// <summary>
    /// Independent idempotency check (properties, not companies) — so
    /// this runs and back-fills sample data even against a database that
    /// already has a company/admin from an earlier run, as long as no
    /// property exists yet.
    /// </summary>
    private static async Task SeedSamplePropertiesAsync(AppDbContext context, Guid companyId)
    {
        var properties = context.Set<Property>();

        if (await properties.AnyAsync())
            return;

        var samples = BuildSampleProperties(companyId);
        await properties.AddRangeAsync(samples);
        await context.SaveChangesAsync();

        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine($" Seeded {samples.Count} sample properties for local testing.");
        Console.ResetColor();
    }

    // Verified, free-to-use (Unsplash License, not Unsplash+) stock photos —
    // generic enough to not read as a specific identifiable real-world
    // building, so they're safe to reuse as illustrative sample data.
    // Source pages (checked 2026-08-24):
    //   https://unsplash.com/photos/modern-living-room-with-elegant-chandeliers-and-comfortable-seating-3tu1nlIg4XM
    //   https://unsplash.com/photos/modern-apartment-building-exterior-with-balconies-and-windows-3fPZoXU1zH4
    private const string InteriorPhoto = "https://images.unsplash.com/photo-1758448755856-01d3add0177b?auto=format&fit=crop&w=1200&q=80";
    private const string BuildingExteriorPhoto = "https://images.unsplash.com/photo-1757970326337-95d7cca56fa1?auto=format&fit=crop&w=1200&q=80";

    private static List<Property> BuildSampleProperties(Guid companyId)
    {
        // Deliberately spread across type / listing type / price / city /
        // neighborhood / bedroom count, so every filter on
        // PropertiesListComponent has something to actually filter.
        var samples = new List<Property>
        {
            new()
            {
                Title = "Apartamento 2 quartos em Copacabana",
                Description = "A poucos quarteirões da praia, prédio com portaria 24h.",
                Type = PropertyType.Apartment, ListingType = ListingType.ForSale,
                Price = 850_000m, CondoFee = 980m,
                Bedrooms = 2, Bathrooms = 1, ParkingSpots = 1, AreaSqm = 65m,
                Address = "Rua Barata Ribeiro, 300", Neighborhood = "Copacabana",
                City = "Rio de Janeiro", State = "RJ",
                ImageUrls = new() { InteriorPhoto, BuildingExteriorPhoto },
            },
            new()
            {
                Title = "Cobertura duplex em Ipanema",
                Description = "Vista mar, terraço com piscina privativa.",
                Type = PropertyType.Apartment, ListingType = ListingType.ForSale,
                Price = 3_200_000m, CondoFee = 2_400m,
                Bedrooms = 4, Bathrooms = 3, ParkingSpots = 2, AreaSqm = 220m,
                Address = "Rua Visconde de Pirajá, 550", Neighborhood = "Ipanema",
                City = "Rio de Janeiro", State = "RJ", IsFeatured = true,
                ImageUrls = new() { InteriorPhoto, BuildingExteriorPhoto },
            },
            new()
            {
                Title = "Kitnet compacta para alugar em Botafogo",
                Description = "Ideal para estudantes, próximo ao metrô.",
                Type = PropertyType.Apartment, ListingType = ListingType.ForRent,
                Price = 2_800m,
                Bedrooms = 1, Bathrooms = 1, ParkingSpots = 0, AreaSqm = 42m,
                Address = "Rua Voluntários da Pátria, 120", Neighborhood = "Botafogo",
                City = "Rio de Janeiro", State = "RJ",
                ImageUrls = new() { InteriorPhoto },
            },
            new()
            {
                Title = "Casa em condomínio na Barra da Tijuca",
                Description = "Condomínio fechado com área de lazer completa.",
                Type = PropertyType.House, ListingType = ListingType.ForSale,
                Price = 1_650_000m, CondoFee = 1_200m,
                Bedrooms = 3, Bathrooms = 3, ParkingSpots = 2, AreaSqm = 180m,
                Address = "Av. das Américas, 4000", Neighborhood = "Barra da Tijuca",
                City = "Rio de Janeiro", State = "RJ", IsFeatured = true,
                ImageUrls = new() { BuildingExteriorPhoto },
            },
            new()
            {
                Title = "Casa de vila em Santa Teresa",
                Description = "Charme colonial, quintal arborizado.",
                Type = PropertyType.House, ListingType = ListingType.ForSale,
                Price = 780_000m,
                Bedrooms = 2, Bathrooms = 2, ParkingSpots = 1, AreaSqm = 110m,
                Address = "Rua Almirante Alexandrino, 800", Neighborhood = "Santa Teresa",
                City = "Rio de Janeiro", State = "RJ",
                ImageUrls = new() { BuildingExteriorPhoto },
            },
            new()
            {
                Title = "Sala comercial no Centro",
                Description = "Prédio corporativo, próximo à Cinelândia.",
                Type = PropertyType.Commercial, ListingType = ListingType.ForRent,
                Price = 3_500m, CondoFee = 600m,
                Bedrooms = 0, Bathrooms = 1, ParkingSpots = 0, AreaSqm = 38m,
                Address = "Av. Rio Branco, 156", Neighborhood = "Centro",
                City = "Rio de Janeiro", State = "RJ",
                ImageUrls = new() { BuildingExteriorPhoto },
            },
            new()
            {
                Title = "Loja de rua em Tijuca",
                Description = "Ótimo fluxo de pedestres, esquina.",
                Type = PropertyType.Commercial, ListingType = ListingType.ForSale,
                Price = 620_000m,
                Bedrooms = 0, Bathrooms = 1, ParkingSpots = 0, AreaSqm = 60m,
                Address = "Rua Conde de Bonfim, 500", Neighborhood = "Tijuca",
                City = "Rio de Janeiro", State = "RJ",
                ImageUrls = new() { BuildingExteriorPhoto },
            },
            new()
            {
                Title = "Terreno plano em Jacarepaguá",
                Description = "Pronto para construir, documentação regularizada.",
                Type = PropertyType.Land, ListingType = ListingType.ForSale,
                Price = 450_000m,
                Bedrooms = 0, Bathrooms = 0, ParkingSpots = 0, AreaSqm = 500m,
                Address = "Estrada do Tindiba, 900", Neighborhood = "Jacarepaguá",
                City = "Rio de Janeiro", State = "RJ",
            },
            new()
            {
                Title = "Sítio com casa sede em Guapimirim",
                Description = "Área verde preservada, nascente própria.",
                Type = PropertyType.Farm, ListingType = ListingType.ForSale,
                Price = 980_000m,
                Bedrooms = 3, Bathrooms = 2, ParkingSpots = 4, AreaSqm = 50_000m,
                Address = "Estrada da Posse, km 8", Neighborhood = "Zona Rural",
                City = "Guapimirim", State = "RJ",
            },
            new()
            {
                Title = "Apartamento garden no Recreio dos Bandeirantes",
                Description = "Jardim privativo, condomínio com clube.",
                Type = PropertyType.Apartment, ListingType = ListingType.ForSale,
                Price = 990_000m, CondoFee = 850m,
                Bedrooms = 3, Bathrooms = 2, ParkingSpots = 2, AreaSqm = 140m,
                Address = "Av. Alfredo Baltazar da Silveira, 700", Neighborhood = "Recreio dos Bandeirantes",
                City = "Rio de Janeiro", State = "RJ", IsFeatured = true,
                ImageUrls = new() { InteriorPhoto, BuildingExteriorPhoto },
            },
            new()
            {
                Title = "Kitnet para alugar em Flamengo",
                Description = "Mobiliada, próximo ao Aterro do Flamengo.",
                Type = PropertyType.Apartment, ListingType = ListingType.ForRent,
                Price = 1_800m,
                Bedrooms = 1, Bathrooms = 1, ParkingSpots = 0, AreaSqm = 28m,
                Address = "Rua Marquês de Abrantes, 45", Neighborhood = "Flamengo",
                City = "Rio de Janeiro", State = "RJ",
                ImageUrls = new() { InteriorPhoto },
            },
            new()
            {
                Title = "Casa em Icaraí",
                Description = "Bairro nobre de Niterói, próxima à praia.",
                Type = PropertyType.House, ListingType = ListingType.ForSale,
                Price = 1_200_000m,
                Bedrooms = 4, Bathrooms = 3, ParkingSpots = 2, AreaSqm = 210m,
                Address = "Rua Gavião Peixoto, 200", Neighborhood = "Icaraí",
                City = "Niterói", State = "RJ",
                ImageUrls = new() { BuildingExteriorPhoto },
            },
            new()
            {
                Title = "Apartamento 3 quartos no Leblon",
                Description = "Vista para a lagoa, prédio de alto padrão.",
                Type = PropertyType.Apartment, ListingType = ListingType.ForSale,
                Price = 4_500_000m, CondoFee = 3_100m,
                Bedrooms = 3, Bathrooms = 3, ParkingSpots = 2, AreaSqm = 150m,
                Address = "Av. Bartolomeu Mitre, 900", Neighborhood = "Leblon",
                City = "Rio de Janeiro", State = "RJ", IsFeatured = true,
                ImageUrls = new() { InteriorPhoto, BuildingExteriorPhoto },
            },
            new()
            {
                Title = "Galpão industrial em Duque de Caxias",
                Description = "Pé direito alto, fácil acesso à Via Dutra.",
                Type = PropertyType.Commercial, ListingType = ListingType.ForRent,
                Price = 12_000m,
                Bedrooms = 0, Bathrooms = 2, ParkingSpots = 5, AreaSqm = 1_200m,
                Address = "Rod. Washington Luiz, km 15", Neighborhood = "Parque Fluminense",
                City = "Duque de Caxias", State = "RJ",
                ImageUrls = new() { BuildingExteriorPhoto },
            },
            new()
            {
                Title = "Studio moderno na Lapa",
                Description = "Reformado, prédio histórico revitalizado.",
                Type = PropertyType.Apartment, ListingType = ListingType.ForRent,
                Price = 2_200m,
                Bedrooms = 1, Bathrooms = 1, ParkingSpots = 0, AreaSqm = 32m,
                Address = "Rua do Lavradio, 60", Neighborhood = "Lapa",
                City = "Rio de Janeiro", State = "RJ",
                ImageUrls = new() { InteriorPhoto },
            },
        };

        foreach (var property in samples)
        {
            property.CompanyId = companyId;
            property.IsActive = true;
        }

        return samples;
    }
}

