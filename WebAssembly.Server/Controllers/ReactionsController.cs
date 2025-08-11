using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;

using WebAssembly.Server.Services;

namespace WebAssembly.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReactionsController : ControllerBase
{
    private readonly SharedDbContext _db;
    private readonly NotificationDispatcher _notifier;

    public ReactionsController(SharedDbContext db, NotificationDispatcher notifier)
    {
        _db = db;
        _notifier = notifier;
    }

    // ✅ POST: Neue Reaktion speichern oder ersetzen - MIT Notifications
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

        // Bestehende Reaktion suchen
        var existing = await _db.ClarificationReactions
            .FirstOrDefaultAsync(r => 
                r.ExpenseId == reaction.ExpenseId && 
                r.UserId == reaction.UserId &&
                r.GroupId == reaction.GroupId);

        bool wasRejected = existing?.Status == ClarificationStatus.Rejected;
        bool isNowRejected = reaction.Status == ClarificationStatus.Rejected;

        if (existing != null)
        {
            _db.ClarificationReactions.Remove(existing);
        }

        _db.ClarificationReactions.Add(reaction);
        await _db.SaveChangesAsync();

        // 📢 Notifications senden
        if (!wasRejected && isNowRejected)
        {
            // Neue Beanstandung
            await _notifier.NotifyAboutRejectionAsync(reaction.ExpenseId, reaction.UserId, reaction.GroupId);
        }
        else if (wasRejected && !isNowRejected)
        {
            // Beanstandung zurückgenommen
            await _notifier.NotifyAboutRejectionWithdrawnAsync(reaction.ExpenseId, reaction.UserId, reaction.GroupId);
        }

        return Ok(reaction);
    }

    // ✅ DELETE: Reaktion eines Users zu einer Ausgabe löschen - MIT Notifications
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

        bool wasRejected = reaction.Status == ClarificationStatus.Rejected;

        _db.ClarificationReactions.Remove(reaction);
        await _db.SaveChangesAsync();

        // 📢 Wenn eine Beanstandung gelöscht wurde, benachrichtigen
        if (wasRejected)
        {
            await _notifier.NotifyAboutRejectionWithdrawnAsync(expenseId, userId, groupId);
        }

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