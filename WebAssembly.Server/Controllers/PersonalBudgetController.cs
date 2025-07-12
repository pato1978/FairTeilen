using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Controllers;

[ApiController]
[Route("api/budget")]
public class BudgetController : ControllerBase
{
    private readonly SharedDbContext _sharedDb;
    private readonly ILogger<BudgetController> _logger;

    public BudgetController(SharedDbContext sharedDb, ILogger<BudgetController> logger)
    {
        _sharedDb = sharedDb;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetBudget(
        [FromQuery] string scope,
        [FromQuery] string month,
        [FromQuery] string userId
    )
    {
        try
        {
            if (scope == "null") scope = null;
            if (month == "null") month = null;
            if (userId == "null") userId = null;

            if (string.IsNullOrWhiteSpace(scope) || string.IsNullOrWhiteSpace(month) || string.IsNullOrWhiteSpace(userId))
                return BadRequest("Scope, Month und UserId sind erforderlich");

            var db = GetDbContext(scope);
            var entry = await EnsureBudgetEntry(db, scope, month, userId);
            return Ok(entry.Amount);
        }
        catch (FormatException fe)
        {
            _logger.LogError(fe, "❌ Ungültiges Datumsformat für Monat: {Month}", month);
            return BadRequest("Ungültiges Monatsformat. Erwartet: yyyy-MM");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Fehler beim Abrufen des Budgets für {Scope} {Month} {UserId}", scope, month, userId);
            return StatusCode(500, $"Interner Fehler: {ex.Message}");
        }
    }

    [HttpPut]
    public async Task<IActionResult> PutBudget([FromBody] BudgetEntry input)
    {
        try
        {
            if (input.Scope == "null") input.Scope = null;
            if (input.Month == "null") input.Month = null;
            if (input.UserId == "null") input.UserId = null;

            if (string.IsNullOrWhiteSpace(input.Scope) || string.IsNullOrWhiteSpace(input.Month) || string.IsNullOrWhiteSpace(input.UserId))
                return BadRequest("Scope, Month und UserId sind erforderlich");

            var db = GetDbContext(input.Scope);

            var existing = await db.Set<BudgetEntry>()
                .FirstOrDefaultAsync(b => b.Month == input.Month && b.Scope == input.Scope && b.UserId == input.UserId);

            if (existing != null)
            {
                existing.Amount = input.Amount;
            }
            else
            {
                input.Id = Guid.NewGuid();
                db.Set<BudgetEntry>().Add(input);
            }

            await db.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Fehler beim Speichern des Budgets für {Scope} {Month} {UserId}", input.Scope, input.Month, input.UserId);
            return StatusCode(500, $"Fehler beim Speichern des Budgets: {ex.Message}");
        }
    }

    private async Task<BudgetEntry> EnsureBudgetEntry(DbContext db, string scope, string month, string userId)
    {
        var entry = scope == "personal"
            ? await db.Set<BudgetEntry>().FirstOrDefaultAsync(b => b.Month == month && b.Scope == scope && b.UserId == userId)
            : await db.Set<BudgetEntry>().FirstOrDefaultAsync(b => b.Month == month && b.Scope == scope);

        if (entry != null)
            return entry;

        if (!DateTime.TryParseExact(month, "yyyy-MM", null, System.Globalization.DateTimeStyles.None, out var monthParsed))
            throw new FormatException("Ungültiges Datumsformat");

        var previousMonth = monthParsed.AddMonths(-1).ToString("yyyy-MM");

        var entryLastMonth = await db.Set<BudgetEntry>()
            .FirstOrDefaultAsync(b => b.Month == previousMonth && b.Scope == scope && b.UserId == userId);

        entry = new BudgetEntry
        {
            Id = Guid.NewGuid(),
            Amount = entryLastMonth?.Amount ?? 0,
            Month = month,
            Scope = scope,
            UserId = userId
        };

        db.Set<BudgetEntry>().Add(entry);
        await db.SaveChangesAsync();

        return entry;
    }

    private DbContext GetDbContext(string scope)
    {
        return scope switch
        {
            "personal" => _sharedDb,
            "shared" or "child" => _sharedDb,
            _ => throw new ArgumentException($"Ungültiger scope: {scope}")
        };
    }
}
