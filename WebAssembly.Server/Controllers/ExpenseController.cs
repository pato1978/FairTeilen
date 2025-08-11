using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Enums;
using WebAssembly.Server.Models;
using WebAssembly.Server.Services;

namespace WebAssembly.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpensesController : ControllerBase
    {
        private readonly SharedDbContext _sharedDb;
        private readonly NotificationService _notifications;
        private readonly NotificationDispatcher _notifier;

        public ExpensesController(SharedDbContext sharedDb, NotificationService notifications, NotificationDispatcher notifier)
        {
            _sharedDb = sharedDb;
            _notifications = notifications;
            _notifier = notifier;
        }
        // ─────────────────────────────────────────────────────────────────────────────
        // 📌 TESTENDPUNKT für das Kopieren wiederkehrender Ausgaben (Datum simulierbar)
        // ─────────────────────────────────────────────────────────────────────────────
        [HttpGet("test/copyRecurring")]
        public async Task<IActionResult> TestCopyRecurring([FromQuery] DateTime simulatedToday)
        {
            await CopyRecurringSharedExpensesAtDate(simulatedToday);
            return Ok("✅ Testlauf erfolgreich für " + simulatedToday.ToString("yyyy-MM-dd"));
        }

        // 🔁 Kopiert wiederkehrende geteilte Ausgaben vom Vormonat in den aktuellen Monat
        public async Task CopyRecurringSharedExpensesAtDate(DateTime simulatedToday)
        {
            var firstOfThisMonth = new DateTime(simulatedToday.Year, simulatedToday.Month, 1);

            // 👉 Bereits kopiert? (gilt nur für Shared/Child!)
            //var alreadyCopied = await _sharedDb.SharedExpenses.AnyAsync(e =>
              //  (e.Type == ExpenseType.Shared || e.Type == ExpenseType.Child) &&
               // e.isRecurring &&
                //e.Date >= firstOfThisMonth &&
                //e.Date < firstOfThisMonth.AddMonths(1)
            //);

            //if (alreadyCopied)
              //  return;

            var lastMonthStart = firstOfThisMonth.AddMonths(-1);
            var lastMonthEnd = firstOfThisMonth;

            var recurringInLastMonth = await _sharedDb.SharedExpenses
                .Where(e =>
                    (e.Type == ExpenseType.Shared || e.Type == ExpenseType.Child) &&
                    e.isRecurring &&
                    e.Date >= lastMonthStart &&
                    e.Date < lastMonthEnd
                )
                .ToListAsync();

            foreach (var oldExp in recurringInLastMonth)
            {
                var newDate = oldExp.Date.AddMonths(1);

                // Sicherheitsprüfung: GroupId darf nicht fehlen
                if (string.IsNullOrWhiteSpace(oldExp.GroupId))
                {
                    Console.WriteLine($"⚠️ WARNUNG: Ausgabenkopie ohne gültige GroupId blockiert: {oldExp.Name} ({oldExp.Id})");
                    continue;
                }

                var exists = await _sharedDb.SharedExpenses.AnyAsync(e =>
                    e.Type == oldExp.Type &&
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
                    Type = oldExp.Type,
                    isBalanced = false,
                    GroupId = oldExp.GroupId,
                    CreatedByUserId = oldExp.CreatedByUserId
                };

                _sharedDb.SharedExpenses.Add(copy);
            }

            await _sharedDb.SaveChangesAsync();
        }

        // 📥 GET: Ausgaben abrufen (nach scope + Zeitraum gefiltert)
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
                return BadRequest("Scope 'personal' wird nicht mehr unterstützt.");

            // ✅ GroupId ist Pflicht für shared/child
            if ((scope == "shared" || scope == "child") && string.IsNullOrWhiteSpace(group))
            {
                Console.WriteLine("❌ GetExpenses → Fehlende GroupId bei scope=" + scope);
                return BadRequest("GroupId ist erforderlich für shared/child Ausgaben");
            }

            IQueryable<Expense> query = scope switch
            {
                "shared" => _sharedDb.SharedExpenses
                    .Where(e => e.Type == ExpenseType.Shared && e.GroupId == group),
                "child" => _sharedDb.SharedExpenses
                    .Where(e => e.Type == ExpenseType.Child && e.GroupId == group),
                _ => throw new ArgumentException($"Unbekannter scope: {scope}")
            };

            query = query.Where(e => e.Date >= monthStart && e.Date < monthEnd);

            var result = await query.OrderByDescending(e => e.Date).ToListAsync();
            return Ok(result);
        }

        // 📤 POST: Neue Ausgabe speichern oder bestehende ersetzen
[HttpPost]
public async Task<IActionResult> SaveExpense([FromBody] ExpenseDto dto)
{
    // ❗ Sicherheitsprüfung: GroupId muss vorhanden sein bei Shared/Child
    if ((dto.Type == ExpenseType.Shared || dto.Type == ExpenseType.Child) &&
        string.IsNullOrWhiteSpace(dto.GroupId))
    {
        Console.WriteLine("❌ SaveExpense → Fehlende GroupId für Typ " + dto.Type + $" (Name: {dto.Name})");
        return BadRequest("Für gemeinsame oder Kind-bezogene Ausgaben ist eine gültige GroupId erforderlich.");
    }

    // 1️⃣ Generiere oder verwende die ID
    var expenseId = string.IsNullOrWhiteSpace(dto.Id)
        ? Guid.NewGuid().ToString()
        : dto.Id;

    // 2️⃣ Prüfe in der DB, ob es diese Ausgabe schon gibt
    var existingExpense = await _sharedDb.SharedExpenses
        .AsNoTracking()
        .FirstOrDefaultAsync(e => e.Id == expenseId);

    var isNew = existingExpense == null;
    Console.WriteLine($"[DEBUG] SaveExpense → isNew = {isNew}, expenseId = {expenseId}");

    // 3️⃣ Baue das Expense-Objekt
    var expense = new Expense
    {
        Id               = expenseId,
        Name             = dto.Name,
        Amount           = dto.Amount,
        Date             = dto.Date,
        MonthKey         = dto.Date.ToString("yyyy-MM"),
        YearKey          = dto.Date.Year.ToString(),
        Category         = dto.Category,
        Type             = dto.Type,
        isRecurring      = dto.isRecurring,
        isBalanced       = dto.isBalanced,
        GroupId          = dto.GroupId,
        CreatedByUserId  = dto.createdByUserId
    };

    // 4️⃣ Falls Update, alten Datensatz entfernen
    if (!isNew)
    {
        var toRemove = await _sharedDb.SharedExpenses
            .FirstOrDefaultAsync(e => e.Id == expenseId);
        if (toRemove != null)
        {
            // 🔒 GroupId-Mismatch prüfen und loggen
            if ((toRemove.Type == ExpenseType.Shared || toRemove.Type == ExpenseType.Child)
                && toRemove.GroupId != dto.GroupId)
            {
                Console.WriteLine($"❌ GroupId-Mismatch beim Update: {toRemove.GroupId} (alt) vs. {dto.GroupId} (neu) für Expense {expense.Id} ({expense.Name})");
                return BadRequest("GroupId stimmt nicht mit der gespeicherten Gruppen-ID überein.");
            }

            _sharedDb.SharedExpenses.Remove(toRemove);
        }
    }

    // 5️⃣ Neuen oder geänderten Datensatz hinzufügen
    await _sharedDb.SharedExpenses.AddAsync(expense);
    await _sharedDb.SaveChangesAsync();

    // 6️⃣ Benachrichtigungen erzeugen
    await _notifier.NotifyUsersAboutExpenseAsync(expense, isNew);

    // 7️⃣ Ergebnis zurückliefern
    return Ok(expense);
}

        // 📤 DELETE: Ausgabe löschen (inkl. GroupId-Check und Logging)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpense(string id, [FromQuery] string? group)
        {
            var expense = await _sharedDb.SharedExpenses.FirstOrDefaultAsync(e => e.Id == id);
            if (expense == null)
                return NotFound();

            // ❗ Sicherheitsprüfung: GroupId bei Shared/Child erforderlich und muss stimmen
            if ((expense.Type == ExpenseType.Shared || expense.Type == ExpenseType.Child))
            {
                if (string.IsNullOrWhiteSpace(group))
                {
                    Console.WriteLine($"❌ DeleteExpense → Fehlende GroupId beim Löschen von {expense.Name} ({expense.Id})");
                    return BadRequest("GroupId fehlt – geteilte Ausgaben dürfen nur mit gültiger Gruppen-ID gelöscht werden.");
                }

                if (expense.GroupId != group)
                {
                    Console.WriteLine($"❌ DeleteExpense → GroupId-Mismatch: {expense.GroupId} (DB) vs. {group} (Request) für Expense {expense.Id} ({expense.Name})");
                    return BadRequest("GroupId stimmt nicht mit der gespeicherten Gruppen-ID überein.");
                }
            }

            _sharedDb.SharedExpenses.Remove(expense);
            await _sharedDb.SaveChangesAsync();

            await _notifier.NotifyUsersAboutDeletedExpenseAsync(expense);


            return NoContent();
        }

        // 📅 Hangfire-Aufruf für automatisches Kopieren wiederkehrender Ausgaben
        [Hangfire.DisableConcurrentExecution(timeoutInSeconds: 60 * 60)]
        public async Task CopyRecurringSharedExpenses()
        {
            var today = DateTime.Today;
            var firstOfThisMonth = new DateTime(today.Year, today.Month, 1);
            var lastMonthStart = firstOfThisMonth.AddMonths(-1);
            var lastMonthEnd = firstOfThisMonth;

            var recurringInLastMonth = await _sharedDb.SharedExpenses
                .Where(e =>
                    (e.Type == ExpenseType.Shared || e.Type == ExpenseType.Child) &&
                    e.isRecurring &&
                    e.Date >= lastMonthStart &&
                    e.Date < lastMonthEnd
                )
                .ToListAsync();

            foreach (var oldExp in recurringInLastMonth)
            {
                var newDate = oldExp.Date.AddMonths(1);

                // Sicherheitsprüfung: GroupId darf nicht fehlen
                if (string.IsNullOrWhiteSpace(oldExp.GroupId))
                {
                    Console.WriteLine($"⚠️ WARNUNG: Ausgabenkopie ohne gültige GroupId blockiert: {oldExp.Name} ({oldExp.Id})");
                    continue;
                }

                var exists = await _sharedDb.SharedExpenses.AnyAsync(e =>
                    e.Type == oldExp.Type &&
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
                    Type = oldExp.Type,
                    isBalanced = false,
                    GroupId = oldExp.GroupId,
                    CreatedByUserId = oldExp.CreatedByUserId
                };

                _sharedDb.SharedExpenses.Add(copy);
            }

            await _sharedDb.SaveChangesAsync();
        }
    }
}
