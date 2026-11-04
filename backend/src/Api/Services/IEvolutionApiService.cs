namespace Api.Services;

public class WhatsAppStatusDto
{
    public string State { get; set; } = "close"; // "close", "connecting", "open"
    public bool IsConnected => State.Equals("open", StringComparison.OrdinalIgnoreCase);
    public string? PhoneNumber { get; set; }
    public string? ProfileName { get; set; }
    public string? ProfilePictureUrl { get; set; }
}

public class WhatsAppConnectDto
{
    public string State { get; set; } = "connecting";
    public string? QrCodeBase64 { get; set; }
    public string? PairingCode { get; set; }
}

public interface IEvolutionApiService
{
    Task<WhatsAppStatusDto> GetStatusAsync(string instanceName);
    Task<WhatsAppConnectDto> ConnectAsync(string instanceName);
    Task<bool> DisconnectAsync(string instanceName);
    Task<bool> SendTextMessageAsync(string instanceName, string phoneNumber, string text);
    Task SetWebhookAsync(string instanceName, string webhookUrl);
}
