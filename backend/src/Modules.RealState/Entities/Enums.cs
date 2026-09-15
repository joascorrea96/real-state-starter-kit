namespace Modules.RealState.Entities;

public enum PropertyType
{
    House = 0,
    Apartment = 1,
    Land = 2,
    Commercial = 3,
    Farm = 4
}

public enum ListingType
{
    ForSale = 0,
    ForRent = 1
}

public enum PropertyStatus
{
    Available = 0,
    Sold = 1,
    Rented = 2,
    Paused = 3
}
