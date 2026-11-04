using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Api.Services;

public class EvolutionApiService : IEvolutionApiService
{
    private readonly HttpClient _http;
    private readonly ILogger<EvolutionApiService> _logger;

    public EvolutionApiService(HttpClient http, IConfiguration config, ILogger<EvolutionApiService> logger)
    {
        _http = http;
        _logger = logger;

        var baseUrl = config["EvolutionApi:BaseUrl"] ?? "https://evolution-api-production-3e62.up.railway.app";
        var apiKey = config["EvolutionApi:ApiKey"] ?? "87d4c7470fd0c0a8cb1a235e9324b5a24f45f6e258497854c9ca3c8abb5515c5";

        _http.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        if (!_http.DefaultRequestHeaders.Contains("apikey"))
        {
            _http.DefaultRequestHeaders.Add("apikey", apiKey);
        }
    }

    public async Task<WhatsAppStatusDto> GetStatusAsync(string instanceName)
    {
        try
        {
            var res = await _http.GetAsync($"instance/connectionState/{instanceName}");
            if (res.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new WhatsAppStatusDto { State = "close" };
            }

            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("Falha ao obter status de {InstanceName}: {StatusCode}", instanceName, res.StatusCode);
                return new WhatsAppStatusDto { State = "close" };
            }

            var json = await res.Content.ReadFromJsonAsync<JsonObject>();
            var state = json?["instance"]?["state"]?.ToString() ?? "close";

            var result = new WhatsAppStatusDto { State = state };

            if (result.IsConnected)
            {
                // Busca dados do perfil conectado
                var fetchRes = await _http.GetAsync($"instance/fetchInstances?instanceName={instanceName}");
                if (fetchRes.IsSuccessStatusCode)
                {
                    var instances = await fetchRes.Content.ReadFromJsonAsync<JsonArray>();
                    var inst = instances?.FirstOrDefault()?.AsObject();
                    if (inst != null)
                    {
                        var ownerJid = inst["ownerJid"]?.ToString() ?? inst["owner"]?.ToString();
                        result.PhoneNumber = ownerJid?.Split('@')[0];
                        result.ProfileName = inst["profileName"]?.ToString();
                        result.ProfilePictureUrl = inst["profilePictureUrl"]?.ToString();
                    }
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter status da Evolution API para {InstanceName}", instanceName);
            return new WhatsAppStatusDto { State = "close" };
        }
    }

    public async Task<WhatsAppConnectDto> ConnectAsync(string instanceName)
    {
        try
        {
            // Verifica se a instância já existe
            var stateRes = await _http.GetAsync($"instance/connectionState/{instanceName}");
            
            if (stateRes.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                // Não existe -> Cria com QR Code habilitado
                var payload = new
                {
                    instanceName = instanceName,
                    qrcode = true,
                    integration = "WHATSAPP-BAILEYS"
                };

                var createRes = await _http.PostAsJsonAsync("instance/create", payload);
                if (!createRes.IsSuccessStatusCode)
                {
                    var err = await createRes.Content.ReadAsStringAsync();
                    _logger.LogError("Erro ao criar instância {InstanceName}: {Error}", instanceName, err);
                    return new WhatsAppConnectDto { State = "close" };
                }

                var createJson = await createRes.Content.ReadFromJsonAsync<JsonObject>();
                var base64 = createJson?["qrcode"]?["base64"]?.ToString();
                var pairingCode = createJson?["qrcode"]?["pairingCode"]?.ToString();

                return new WhatsAppConnectDto
                {
                    State = "connecting",
                    QrCodeBase64 = base64,
                    PairingCode = pairingCode
                };
            }

            var stateJson = await stateRes.Content.ReadFromJsonAsync<JsonObject>();
            var currentState = stateJson?["instance"]?["state"]?.ToString() ?? "close";

            if (currentState.Equals("open", StringComparison.OrdinalIgnoreCase))
            {
                return new WhatsAppConnectDto { State = "open" };
            }

            // Já existe mas não está conectada -> Solicita novo QR Code
            var connectRes = await _http.GetAsync($"instance/connect/{instanceName}");
            if (connectRes.IsSuccessStatusCode)
            {
                var connectJson = await connectRes.Content.ReadFromJsonAsync<JsonObject>();
                var base64 = connectJson?["base64"]?.ToString();
                var pairingCode = connectJson?["pairingCode"]?.ToString();

                return new WhatsAppConnectDto
                {
                    State = "connecting",
                    QrCodeBase64 = base64,
                    PairingCode = pairingCode
                };
            }

            return new WhatsAppConnectDto { State = "connecting" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao iniciar conexão com Evolution API para {InstanceName}", instanceName);
            return new WhatsAppConnectDto { State = "close" };
        }
    }

    public async Task<bool> DisconnectAsync(string instanceName)
    {
        try
        {
            var res = await _http.DeleteAsync($"instance/delete/{instanceName}");
            return res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao desconectar instância {InstanceName}", instanceName);
            return false;
        }
    }

    public async Task<bool> SendTextMessageAsync(string instanceName, string phoneNumber, string text)
    {
        try
        {
            // Limpa o número removendo caracteres não numéricos
            var cleanNumber = new string(phoneNumber.Where(char.IsDigit).ToArray());
            if (!cleanNumber.StartsWith("55") && (cleanNumber.Length == 10 || cleanNumber.Length == 11))
            {
                cleanNumber = "55" + cleanNumber;
            }

            var payload = new
            {
                number = cleanNumber,
                text = text
            };

            var res = await _http.PostAsJsonAsync($"message/sendText/{instanceName}", payload);
            return res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao enviar mensagem via Evolution API para {Number}", phoneNumber);
            return false;
        }
    }
}
