using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonthlyConfirmationController : ControllerBase
{
    private readonly SharedDbContext _db;

    public MonthlyConfirmationController(SharedDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Gibt alle Bestätigungen für einen Monat und eine Gruppe zurück
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<Dictionary<string, bool>>> GetConfirmations([FromQuery] string groupId, [FromQuery] string monthKey)
    {
        var result = await _db.MonthlyConfirmations
            .Where(c => c.GroupId == groupId && c.MonthKey == monthKey)
            .ToDictionaryAsync(c => c.UserId, c => c.Confirmed);

        return Ok(result);
    }

    /// <summary>
    /// Speichert oder aktualisiert eine Bestätigung oder Rücknahme
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> SetConfirmation([FromBody] MonthlyConfirmation input)
    {
        var existing = await _db.MonthlyConfirmations.FirstOrDefaultAsync(c =>
            c.UserId == input.UserId &&
            c.GroupId == input.GroupId &&
            c.MonthKey == input.MonthKey
        );

        if (existing != null)
        {
            existing.Confirmed = input.Confirmed;
            existing.ConfirmedAt = input.Confirmed ? DateTime.UtcNow : null;
        }
        else
        {
            input.Id = Guid.NewGuid(); // Nur wenn nicht gesetzt
            input.ConfirmedAt = input.Confirmed ? DateTime.UtcNow : null;

            _db.MonthlyConfirmations.Add(input);
        }

        await _db.SaveChangesAsync();
        return Ok();
    }
}