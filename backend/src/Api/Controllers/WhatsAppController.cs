using Api.Auth;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WhatsAppController : ControllerBase
{
    private readonly IEvolutionApiService _evolutionApi;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<WhatsAppController> _logger;

    public WhatsAppController(
        IEvolutionApiService evolutionApi,
        ICurrentUserService currentUser,
        ILogger<WhatsAppController> logger)
    {
        _evolutionApi = evolutionApi;
        _currentUser = currentUser;
        _logger = logger;
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
        return Ok(result);
    }

    [HttpPost("disconnect")]
    public async Task<IActionResult> Disconnect()
    {
        var instanceName = GetInstanceName();
        var success = await _evolutionApi.DisconnectAsync(instanceName);
        return Ok(new { success });
    }
}
