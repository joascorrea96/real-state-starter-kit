namespace Api.Auth;

public interface IPasswordHasher
{
    string Hash(string plainTextPassword);
    bool Verify(string plainTextPassword, string passwordHash);
}

/// <summary>
/// Thin wrapper around BCrypt.Net-Next. Kept behind an interface so the
/// hashing algorithm can be swapped later without touching any controller
/// or service that depends on it.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    public string Hash(string plainTextPassword)
        => BCrypt.Net.BCrypt.HashPassword(plainTextPassword);

    public bool Verify(string plainTextPassword, string passwordHash)
        => BCrypt.Net.BCrypt.Verify(plainTextPassword, passwordHash);
}
