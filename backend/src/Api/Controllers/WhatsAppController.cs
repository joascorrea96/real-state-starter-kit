using System.Text.Json.Nodes;
using Api.Auth;
using Api.Services;
using Core.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Modules.RealState.Entities;

namespace Api.Controllers;

public record SendWhatsAppMessageRequest(string Message);

public record WhatsAppConversationDto(
    string Phone,
    string ContactName,
    Guid? LeadId,
    string? LeadStatus,
    string? PropertyTitle,
    string LastMessage,
    DateTime LastMessageTimestamp,
    bool LastMessageFromMe,
    int TotalMessages
);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WhatsAppController : ControllerBase
{
    private readonly IEvolutionApiService _evolutionApi;
    private readonly ICurrentUserService _currentUser;
    private readonly AppDbContext _db;
    private readonly ILogger<WhatsAppController> _logger;
    private readonly IConfiguration _config;

    public WhatsAppController(
        IEvolutionApiService evolutionApi,
        ICurrentUserService currentUser,
        AppDbContext db,
        ILogger<WhatsAppController> logger,
        IConfiguration config)
    {
        _evolutionApi = evolutionApi;
        _currentUser = currentUser;
        _db = db;
        _logger = logger;
        _config = config;
    }

    private string GetInstanceName() => $"imob_{_currentUser.CompanyId:N}";

    [HttpGet("status")]
    public async Task<ActionResult<WhatsAppStatusDto>> GetStatus()
    {
        var instanceName = GetInstanceName();
        var status = await _evolutionApi.GetStatusAsync(instanceName);
        return Ok(status);
    }

    [HttpPost("connect")]
    public async Task<ActionResult<WhatsAppConnectDto>> Connect()
    {
        var instanceName = GetInstanceName();
        var result = await _evolutionApi.ConnectAsync(instanceName);

        // Configura o Webhook na Evolution API apontando para este backend
        var webhookBase = _config["BackendUrl"] ?? "https://api-imobiliaria-mmcg.onrender.com";
        var webhookUrl = $"{webhookBase.TrimEnd('/')}/api/whatsapp/webhook";
        _ = _evolutionApi.SetWebhookAsync(instanceName, webhookUrl);

        return Ok(result);
    }

    [HttpPost("disconnect")]
    public async Task<IActionResult> Disconnect()
    {
        var instanceName = GetInstanceName();
        var success = await _evolutionApi.DisconnectAsync(instanceName);
        return Ok(new { success });
    }

    /// <summary>
    /// Retorna o histórico de mensagens trocadas com o lead específico
    /// </summary>
    [HttpGet("leads/{leadId:guid}/messages")]
    public async Task<ActionResult<IEnumerable<WhatsAppMessage>>> GetLeadMessages(Guid leadId)
    {
        var lead = await _db.Set<Lead>()
            .FirstOrDefaultAsync(l => l.Id == leadId && l.CompanyId == _currentUser.CompanyId);

        if (lead is null) return NotFound("Lead não encontrado");

        var cleanLeadPhone = new string(lead.Phone.Where(char.IsDigit).ToArray());
        var phoneTail = cleanLeadPhone.Length >= 8 ? cleanLeadPhone[^8..] : cleanLeadPhone;

        var messages = await _db.Set<WhatsAppMessage>()
            .Where(m => m.CompanyId == _currentUser.CompanyId &&
                        (m.LeadId == leadId || (phoneTail.Length > 0 && m.Phone.EndsWith(phoneTail))))
            .OrderBy(m => m.Timestamp)
            .ToListAsync();

        return Ok(messages);
    }

    /// <summary>
    /// Envia uma mensagem via WhatsApp para o lead e salva no banco de dados
    /// </summary>
    [HttpPost("leads/{leadId:guid}/messages")]
    public async Task<ActionResult<WhatsAppMessage>> SendLeadMessage(Guid leadId, [FromBody] SendWhatsAppMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("A mensagem não pode ser vazia.");
        }

        var lead = await _db.Set<Lead>()
            .FirstOrDefaultAsync(l => l.Id == leadId && l.CompanyId == _currentUser.CompanyId);

        if (lead is null) return NotFound("Lead não encontrado.");

        if (string.IsNullOrWhiteSpace(lead.Phone))
        {
            return BadRequest("O lead não possui telefone cadastrado.");
        }

        var instanceName = GetInstanceName();
        var status = await _evolutionApi.GetStatusAsync(instanceName);
        if (!status.IsConnected)
        {
            return BadRequest("O WhatsApp da imobiliária não está conectado. Vá até o menu WhatsApp para conectar.");
        }

        var sent = await _evolutionApi.SendTextMessageAsync(instanceName, lead.Phone, request.Message);
        if (!sent)
        {
            return StatusCode(500, "Falha ao enviar a mensagem pelo WhatsApp.");
        }

        var cleanPhone = new string(lead.Phone.Where(char.IsDigit).ToArray());
        var messageEntity = new WhatsAppMessage
        {
            CompanyId = _currentUser.CompanyId,
            LeadId = lead.Id,
            Phone = cleanPhone,
            FromMe = true,
            SenderName = _currentUser.Name ?? "Imobiliária",
            MessageText = request.Message.Trim(),
            MessageType = "conversation",
            Status = "SENT",
            Timestamp = DateTime.UtcNow
        };

        _db.Set<WhatsAppMessage>().Add(messageEntity);
        await _db.SaveChangesAsync();

        return Ok(messageEntity);
    }

    /// <summary>
    /// Retorna a lista de todas as conversas agrupadas com a última mensagem trocada
    /// </summary>
    [HttpGet("conversations")]
    public async Task<ActionResult<IEnumerable<WhatsAppConversationDto>>> GetConversations()
    {
        var companyId = _currentUser.CompanyId;

        var messages = await _db.Set<WhatsAppMessage>()
            .Where(m => m.CompanyId == companyId)
            .OrderByDescending(m => m.Timestamp)
            .ToListAsync();

        if (messages.Count == 0)
        {
            return Ok(Enumerable.Empty<WhatsAppConversationDto>());
        }

        var leads = await _db.Set<Lead>()
            .Include(l => l.Property)
            .Where(l => l.CompanyId == companyId)
            .ToListAsync();

        var conversationGroups = messages
            .GroupBy(m =>
            {
                var clean = new string(m.Phone.Where(char.IsDigit).ToArray());
                return clean.Length >= 8 ? clean[^8..] : clean;
            })
            .Where(g => !string.IsNullOrEmpty(g.Key))
            .ToList();

        var result = new List<WhatsAppConversationDto>();

        foreach (var group in conversationGroups)
        {
            var latestMsg = group.OrderByDescending(m => m.Timestamp).First();
            var phoneTail = group.Key;

            var lead = leads.FirstOrDefault(l =>
            {
                var lClean = new string(l.Phone.Where(char.IsDigit).ToArray());
                return lClean.EndsWith(phoneTail) || l.Phone.Contains(phoneTail);
            });

            string contactName = lead?.Name
                ?? group.FirstOrDefault(m => !m.FromMe && !string.IsNullOrWhiteSpace(m.SenderName))?.SenderName
                ?? latestMsg.Phone;

            result.Add(new WhatsAppConversationDto(
                Phone: latestMsg.Phone,
                ContactName: contactName,
                LeadId: lead?.Id,
                LeadStatus: lead?.Status.ToString(),
                PropertyTitle: lead?.Property?.Title,
                LastMessage: latestMsg.MessageText,
                LastMessageTimestamp: latestMsg.Timestamp,
                LastMessageFromMe: latestMsg.FromMe,
                TotalMessages: group.Count()
            ));
        }

        return Ok(result.OrderByDescending(c => c.LastMessageTimestamp));
    }

    /// <summary>
    /// Retorna o histórico de mensagens de um telefone/conversa específica
    /// </summary>
    [HttpGet("conversations/{phone}/messages")]
    public async Task<ActionResult<IEnumerable<WhatsAppMessage>>> GetConversationMessages(string phone)
    {
        var cleanPhone = new string(phone.Where(char.IsDigit).ToArray());
        var phoneTail = cleanPhone.Length >= 8 ? cleanPhone[^8..] : cleanPhone;

        var messages = await _db.Set<WhatsAppMessage>()
            .Where(m => m.CompanyId == _currentUser.CompanyId &&
                        (m.Phone == phone || (phoneTail.Length > 0 && m.Phone.EndsWith(phoneTail))))
            .OrderBy(m => m.Timestamp)
            .ToListAsync();

        return Ok(messages);
    }

    /// <summary>
    /// Envia uma mensagem diretamente para um telefone/conversa
    /// </summary>
    [HttpPost("conversations/{phone}/messages")]
    public async Task<ActionResult<WhatsAppMessage>> SendConversationMessage(string phone, [FromBody] SendWhatsAppMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("A mensagem não pode ser vazia.");
        }

        var cleanPhone = new string(phone.Where(char.IsDigit).ToArray());
        if (string.IsNullOrWhiteSpace(cleanPhone))
        {
            return BadRequest("Telefone inválido.");
        }

        var instanceName = GetInstanceName();
        var status = await _evolutionApi.GetStatusAsync(instanceName);
        if (!status.IsConnected)
        {
            return BadRequest("O WhatsApp da imobiliária não está conectado. Vá até o menu WhatsApp para conectar.");
        }

        var sent = await _evolutionApi.SendTextMessageAsync(instanceName, cleanPhone, request.Message);
        if (!sent)
        {
            return StatusCode(500, "Falha ao enviar a mensagem pelo WhatsApp.");
        }

        var phoneTail = cleanPhone.Length >= 8 ? cleanPhone[^8..] : cleanPhone;
        var lead = await _db.Set<Lead>()
            .FirstOrDefaultAsync(l => l.CompanyId == _currentUser.CompanyId && l.Phone.Contains(phoneTail));

        var messageEntity = new WhatsAppMessage
        {
            CompanyId = _currentUser.CompanyId,
            LeadId = lead?.Id,
            Phone = cleanPhone,
            FromMe = true,
            SenderName = _currentUser.Name ?? "Imobiliária",
            MessageText = request.Message.Trim(),
            MessageType = "conversation",
            Status = "SENT",
            Timestamp = DateTime.UtcNow
        };

        _db.Set<WhatsAppMessage>().Add(messageEntity);
        await _db.SaveChangesAsync();

        return Ok(messageEntity);
    }

    /// <summary>
    /// Webhook chamado pela Evolution API quando mensagens chegam ou mudam de status
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleWebhook([FromBody] JsonObject payload)
    {
        try
        {
            var eventType = payload["event"]?.ToString() ?? string.Empty;
            var instance = payload["instance"]?.ToString() ?? string.Empty;

            if (!instance.StartsWith("imob_"))
            {
                return Ok();
            }

            var companyGuidRaw = instance[5..];
            if (!Guid.TryParseExact(companyGuidRaw, "N", out var companyId))
            {
                return Ok();
            }

            if (eventType.Equals("messages.upsert", StringComparison.OrdinalIgnoreCase))
            {
                var data = payload["data"]?.AsObject();
                if (data == null) return Ok();

                var key = data["key"]?.AsObject();
                var fromMe = key?["fromMe"]?.GetValue<bool>() ?? false;
                var remoteJid = key?["remoteJid"]?.ToString() ?? string.Empty;

                // Ignora mensagens de grupos ou transmissões
                if (remoteJid.Contains("@g.us") || remoteJid.Contains("status@broadcast"))
                {
                    return Ok();
                }

                var cleanPhone = remoteJid.Split('@')[0];
                var messageObj = data["message"]?.AsObject();
                var text = messageObj?["conversation"]?.ToString() ??
                           messageObj?["extendedTextMessage"]?["text"]?.ToString() ??
                           string.Empty;

                if (string.IsNullOrWhiteSpace(text))
                {
                    return Ok();
                }

                var phoneTail = cleanPhone.Length >= 8 ? cleanPhone[^8..] : cleanPhone;

                // Tenta associar a um lead existente
                var lead = await _db.Set<Lead>()
                    .FirstOrDefaultAsync(l => l.CompanyId == companyId && l.Phone.Contains(phoneTail));

                var pushName = data["pushName"]?.ToString();
                var externalId = key?["id"]?.ToString();

                if (!string.IsNullOrEmpty(externalId))
                {
                    var alreadyExists = await _db.Set<WhatsAppMessage>()
                        .AnyAsync(m => m.CompanyId == companyId && m.ExternalId == externalId);
                    if (alreadyExists) return Ok();
                }

                if (fromMe)
                {
                    // Evita duplicar mensagens que o próprio CRM acabou de salvar via SendLeadMessage
                    var recentCutoff = DateTime.UtcNow.AddSeconds(-45);
                    var existingRecent = await _db.Set<WhatsAppMessage>()
                        .FirstOrDefaultAsync(m => m.CompanyId == companyId &&
                                                  m.FromMe &&
                                                  m.Phone.EndsWith(phoneTail) &&
                                                  m.MessageText == text &&
                                                  m.Timestamp >= recentCutoff);

                    if (existingRecent != null)
                    {
                        if (!string.IsNullOrEmpty(externalId) && string.IsNullOrEmpty(existingRecent.ExternalId))
                        {
                            existingRecent.ExternalId = externalId;
                            await _db.SaveChangesAsync();
                        }
                        return Ok();
                    }
                }

                var msg = new WhatsAppMessage
                {
                    CompanyId = companyId,
                    LeadId = lead?.Id,
                    RemoteJid = remoteJid,
                    Phone = cleanPhone,
                    FromMe = fromMe,
                    SenderName = fromMe ? "Imobiliária" : (pushName ?? "Cliente"),
                    MessageText = text,
                    MessageType = "conversation",
                    Status = fromMe ? "SENT" : "RECEIVED",
                    ExternalId = externalId,
                    Timestamp = DateTime.UtcNow
                };

                _db.Set<WhatsAppMessage>().Add(msg);
                await _db.SaveChangesAsync();
            }

            return Ok(new { received = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar webhook do WhatsApp");
            return Ok(); // Retorna 200 para a Evolution API não ficar retentando em loop se der erro
        }
    }
}
