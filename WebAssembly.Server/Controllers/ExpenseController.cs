using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpensesController : ControllerBase
    {
        private readonly SharedDbContext _sharedDb;

        public ExpensesController(SharedDbContext sharedDb)
        {
            _sharedDb = sharedDb;
        }
        [HttpGet("test/copyRecurring")]
        public async Task<IActionResult> TestCopyRecurring([FromQuery] DateTime simulatedToday)
        {
            await CopyRecurringSharedExpensesAtDate(simulatedToday);
            return Ok("✅ Testlauf erfolgreich für " + simulatedToday.ToString("yyyy-MM-dd"));
        }

public async Task CopyRecurringSharedExpensesAtDate(DateTime simulatedToday)
{
    var firstOfThisMonth = new DateTime(simulatedToday.Year, simulatedToday.Month, 1);

    var alreadyCopied = await _sharedDb.SharedExpenses.AnyAsync(e =>
        (e.isShared || e.isChild) &&
        e.isRecurring &&
        e.Date >= firstOfThisMonth &&
        e.Date < firstOfThisMonth.AddMonths(1)
    );

    if (alreadyCopied)
        return;

    var lastMonthStart = firstOfThisMonth.AddMonths(-1);
    var lastMonthEnd = firstOfThisMonth;

    var recurringInLastMonth = await _sharedDb.SharedExpenses
        .Where(e =>
            (e.isShared || e.isChild) &&
            e.isRecurring &&
            e.Date >= lastMonthStart &&
            e.Date < lastMonthEnd
        )
        .ToListAsync();

    foreach (var oldExp in recurringInLastMonth)
    {
        var newDate = oldExp.Date.AddMonths(1);

        var exists = await _sharedDb.SharedExpenses.AnyAsync(e =>
            (e.isShared || e.isChild) &&
            e.isRecurring &&
            e.Name == oldExp.Name &&
            e.Amount == oldExp.Amount &&
            e.Date == newDate &&
            e.GroupId == oldExp.GroupId
        );

        if (exists)
            continue;

        var copy = new Expense
        {
            Id = Guid.NewGuid().ToString(),
            Name = oldExp.Name,
            Amount = oldExp.Amount,
            Date = newDate,
            MonthKey = newDate.ToString("yyyy-MM"),
            YearKey = newDate.Year.ToString(),
            Category = oldExp.Category,
            isRecurring = true,
            isShared = oldExp.isShared,
            isChild = oldExp.isChild,
            isBalanced = false,
            GroupId = oldExp.GroupId,
            CreatedByUserId = oldExp.CreatedByUserId
        };

        _sharedDb.SharedExpenses.Add(copy);
    }

    await _sharedDb.SaveChangesAsync();
}
        [HttpGet]
        public async Task<IActionResult> GetExpenses(
            [FromQuery] string scope,
            [FromQuery] string? group,
            [FromQuery] string? month,
            [FromQuery] string? userId
        )
        {
            if (string.IsNullOrWhiteSpace(scope))
                return BadRequest("Parameter 'scope' ist erforderlich.");

            if (!DateTime.TryParseExact($"{month}-01", "yyyy-MM-dd", null,
                    System.Globalization.DateTimeStyles.None, out var monthStart))
            {
                Console.WriteLine($"DEBUG → ❌ TryParseExact fehlgeschlagen für month='{month}'");
                return BadRequest("Ungültiges Datumsformat. Erwartet wird 'YYYY-MM'.");
            }

            var monthEnd = monthStart.AddMonths(1);

            if (scope == "personal")
                return BadRequest("Scope 'personal' wird nicht mehr unterst\u00fctzt.");

            IQueryable<Expense> query = scope switch
            {
                "shared" => _sharedDb.SharedExpenses
                    .Where(e => e.isShared && (string.IsNullOrWhiteSpace(group) || e.GroupId == group)),
                "child" => _sharedDb.SharedExpenses
                    .Where(e => e.isChild),
                _ => throw new ArgumentException($"Unbekannter scope: {scope}")
            };

            query = query.Where(e => e.Date >= monthStart && e.Date < monthEnd);

            var result = await query.OrderByDescending(e => e.Date).ToListAsync();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> SaveExpense([FromBody] ExpenseDto dto)
        {
            var monthKey = dto.Date.ToString("yyyy-MM");
            var yearKey = dto.Date.Year.ToString();
            var isNew = string.IsNullOrWhiteSpace(dto.Id);
            var expenseId = isNew ? Guid.NewGuid().ToString() : dto.Id;

            var expense = new Expense
            {
                Id = expenseId,
                Name = dto.Name,
                Amount = dto.Amount,
                Date = dto.Date,
                MonthKey = monthKey,
                YearKey = yearKey,
                Category = dto.Category,
                isPersonal = dto.isPersonal,
                isChild = dto.isChild,
                isShared = dto.isShared,
                isRecurring = dto.isRecurring,
                isBalanced = dto.isBalanced,
                GroupId = dto.GroupId,
                CreatedByUserId = dto.createdByUserId // Achtung: „createdByUserId“ kleingeschrieben
            };

            var context = (DbContext)_sharedDb;

            if (!isNew)
            {
                var existing = await context.Set<Expense>().FirstOrDefaultAsync(e => e.Id == expense.Id);
                if (existing != null)
                    context.Remove(existing);
            }

            await context.AddAsync(expense);
            await context.SaveChangesAsync();

            return Ok(expense);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpense(string id)
        {
            var expense = await _sharedDb.SharedExpenses.FirstOrDefaultAsync(e => e.Id == id);
            if (expense != null)
            {
                _sharedDb.SharedExpenses.Remove(expense);
                await _sharedDb.SaveChangesAsync();
                return NoContent();
            }

            return NotFound();
        }

        // ───────────────────────────────────────────────────────────────────────────
        // ❗️ NEU: Diese Methode ist jetzt PUBLIC und ohne Übergabe‐Parameter.
        // Hangfire fragt hier selbst ab, ob für den aktuellen Monat schon kopiert ist.
        // ───────────────────────────────────────────────────────────────────────────
        [Hangfire.DisableConcurrentExecution(timeoutInSeconds: 60 * 60)]
        public async Task CopyRecurringSharedExpenses()
        {
            // 1) Aktuellen Monatsanfang ermitteln
            var today = DateTime.Today;
            var firstOfThisMonth = new DateTime(today.Year, today.Month, 1);

            // ─────────────────────────────────────────────────────────────────────────────────
            // Entfernt: globaler Abbruch, wenn irgendeine Kopie bereits existiert.
            // Stattdessen findet die Duplikatprüfung pro Eintrag in der Schleife statt.
            // ─────────────────────────────────────────────────────────────────────────────────

            // 2) Wiederkehrende Ausgaben aus dem Vormonat auslesen
            var lastMonthStart = firstOfThisMonth.AddMonths(-1);
            var lastMonthEnd = firstOfThisMonth; // exklusiv

            var recurringInLastMonth = await _sharedDb.SharedExpenses
                .Where(e =>
                    (e.isShared || e.isChild) &&
                    e.isRecurring &&
                    e.Date >= lastMonthStart &&
                    e.Date < lastMonthEnd
                )
                .ToListAsync();

            // 3) Für jeden alten Eintrag: prüfen und ggf. kopieren
            foreach (var oldExp in recurringInLastMonth)
            {
                var newDate = oldExp.Date.AddMonths(1);

                // Duplikatprüfungen (nur identische Einträge überspringen)
                var exists = await _sharedDb.SharedExpenses.AnyAsync(e =>
                    (e.isShared || e.isChild) &&
                    e.isRecurring &&
                    e.Name == oldExp.Name &&
                    e.Amount == oldExp.Amount &&
                    e.Date == newDate &&
                    e.GroupId == oldExp.GroupId
                );

                if (exists)
                    continue;

                var copy = new Expense
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = oldExp.Name,
                    Amount = oldExp.Amount,
                    Date = newDate,
                    MonthKey = newDate.ToString("yyyy-MM"),
                    YearKey = newDate.Year.ToString(),
                    Category = oldExp.Category,
                    isRecurring = true,
                    isShared = oldExp.isShared,
                    isChild = oldExp.isChild,
                    isBalanced = false,
                    GroupId = oldExp.GroupId,
                    CreatedByUserId = oldExp.CreatedByUserId
                };

                _sharedDb.SharedExpenses.Add(copy);
            }

            // 4) Änderungen in die Datenbank schreiben
            await _sharedDb.SaveChangesAsync();
        }
    }
}
