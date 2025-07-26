using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReactionsController : ControllerBase
{
    private readonly SharedDbContext _db;

    public ReactionsController(SharedDbContext db)
    {
        _db = db;
    }

    // ✅ POST: Neue Reaktion speichern oder ersetzen - MIT GroupId-Validierung
    [HttpPost]
    public async Task<IActionResult> PostReaction([FromBody] ClarificationReaction reaction)
    {
        // 🔒 Sicherheitsprüfung: GroupId muss vorhanden sein
        if (string.IsNullOrWhiteSpace(reaction.GroupId))
            return BadRequest("GroupId ist erforderlich für Reaktionen");

        // 🔍 Prüfen ob die Ausgabe existiert und zur gleichen Gruppe gehört
        var expense = await _db.SharedExpenses
            .FirstOrDefaultAsync(e => e.Id == reaction.ExpenseId);
        
        if (expense == null)
            return NotFound("Ausgabe nicht gefunden");
            
        if (expense.GroupId != reaction.GroupId)
            return BadRequest("Reaktion und Ausgabe müssen zur selben Gruppe gehören");

        // Bestehende Reaktion suchen und ersetzen
        var existing = await _db.ClarificationReactions
            .FirstOrDefaultAsync(r => 
                r.ExpenseId == reaction.ExpenseId && 
                r.UserId == reaction.UserId &&
                r.GroupId == reaction.GroupId);

        if (existing != null)
        {
            _db.ClarificationReactions.Remove(existing);
        }

        _db.ClarificationReactions.Add(reaction);
        await _db.SaveChangesAsync();

        return Ok(reaction);
    }

    // ✅ DELETE: Reaktion eines Users zu einer Ausgabe löschen - MIT GroupId
    [HttpDelete("{expenseId}/{userId}")]
    public async Task<IActionResult> DeleteReaction(
        string expenseId, 
        string userId,
        [FromQuery] string groupId)
    {
        // 🔒 GroupId-Validierung
        if (string.IsNullOrWhiteSpace(groupId))
            return BadRequest("GroupId ist erforderlich");

        var reaction = await _db.ClarificationReactions
            .FirstOrDefaultAsync(r => 
                r.ExpenseId == expenseId && 
                r.UserId == userId &&
                r.GroupId == groupId);

        if (reaction == null)
            return NotFound();

        _db.ClarificationReactions.Remove(reaction);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ✅ GET: Alle Reaktionen zu einer bestimmten Ausgabe - MIT GroupId-Filter
    [HttpGet("expense/{expenseId}")]
    public async Task<ActionResult<List<ClarificationReaction>>> GetReactionsForExpense(
        string expenseId,
        [FromQuery] string groupId)
    {
        // 🔒 GroupId-Validierung
        if (string.IsNullOrWhiteSpace(groupId))
            return BadRequest("GroupId ist erforderlich");

        var reactions = await _db.ClarificationReactions
            .Where(r => r.ExpenseId == expenseId && r.GroupId == groupId)
            .ToListAsync();

        return Ok(reactions);
    }

    // ✅ GET: Alle Reaktionen für einen bestimmten Monat - MIT GroupId-Filter
    [HttpGet("month/{monthId}")]
    public async Task<IActionResult> GetReactionsForMonth(
        string monthId,
        [FromQuery] string groupId)
    {
        // 🔒 GroupId-Validierung
        if (string.IsNullOrWhiteSpace(groupId))
            return BadRequest("GroupId ist erforderlich");

        // 🔍 Monatsbereich berechnen
        if (!DateTime.TryParse($"{monthId}-01", out var firstOfMonth))
            return BadRequest("Invalid month format. Use YYYY-MM.");

        var nextMonth = firstOfMonth.AddMonths(1);

        // 🔍 Nur die IDs der Ausgaben im Zeitraum UND in der Gruppe holen
        var expenseIds = await _db.SharedExpenses
            .Where(e => 
                e.Date >= firstOfMonth && 
                e.Date < nextMonth &&
                e.GroupId == groupId)
            .Select(e => e.Id)
            .ToListAsync();

        // 🧠 Nur Reaktionen zu diesen Ausgaben UND in der gleichen Gruppe
        var reactions = await _db.ClarificationReactions
            .Where(r => 
                expenseIds.Contains(r.ExpenseId) &&
                r.GroupId == groupId)
            .ToListAsync();

        return Ok(reactions);
    }

    // ✅ GET: Alle Reaktionen eines Nutzers - MIT GroupId-Filter
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<ClarificationReaction>>> GetReactionsByUser(
        string userId,
        [FromQuery] string groupId)
    {
        // 🔒 GroupId-Validierung
        if (string.IsNullOrWhiteSpace(groupId))
            return BadRequest("GroupId ist erforderlich");

        var reactions = await _db.ClarificationReactions
            .Where(r => r.UserId == userId && r.GroupId == groupId)
            .ToListAsync();

        return Ok(reactions);
    }
}