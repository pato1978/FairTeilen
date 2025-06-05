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
        private readonly AppDbContext _appDb;
        private readonly SharedDbContext _sharedDb;

        public ExpensesController(AppDbContext appDb, SharedDbContext sharedDb)
        {
            _appDb = appDb;
            _sharedDb = sharedDb;
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

            var today = DateTime.Today;
            var firstOfThisMonth = new DateTime(today.Year, today.Month, 1);

            Console.WriteLine($"DEBUG → 📅 Today: {today:yyyy-MM-dd}");
            Console.WriteLine($"DEBUG → 📅 firstOfThisMonth: {firstOfThisMonth:yyyy-MM-dd}");
            Console.WriteLine($"DEBUG → 📅 monthStart (aus Query): {monthStart:yyyy-MM-dd}");
            Console.WriteLine($"DEBUG → 🧾 scope: {scope}");

            if (scope == "personal" && monthStart == firstOfThisMonth)
            {
                Console.WriteLine("DEBUG → 🔁 CopyRecurringFromPreviousMonth wird aufgerufen");
                await CopyRecurringFromPreviousMonth(monthStart);
            }
            else
            {
                Console.WriteLine("DEBUG → ⏭️ CopyRecurringFromPreviousMonth NICHT aufgerufen");
            }

            IQueryable<Expense> query = scope switch
            {
                "personal" => _appDb.Expenses
                    .Where(e => e.isPersonal && !e.isShared && !e.isChild),
                "shared" => _sharedDb.SharedExpenses
                    .Where(e => e.isShared && (string.IsNullOrWhiteSpace(group) || e.GroupId == group)),
                "child" => _sharedDb.SharedExpenses
                    .Where(e => e.isChild),
                _ => throw new ArgumentException($"Unbekannter scope: {scope}")
            };

            query = query.Where(e => e.Date >= monthStart && e.Date < monthEnd);

            if (scope == "personal" && !string.IsNullOrWhiteSpace(userId))
            {
                query = query.Where(e => e.CreatedByUserId == userId);
            }

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
                CreatedByUserId = dto.createdByUserId
            };

            var context = (dto.isShared || dto.isChild) ? (DbContext)_sharedDb : _appDb;

            if (!isNew)
            {
                var existing = await context.Set<Expense>().FirstOrDefaultAsync(e => e.Id == expense.Id);
                if (existing != null)
                {
                    context.Remove(existing);
                }
            }

            await context.AddAsync(expense);
            await context.SaveChangesAsync();

            return Ok(expense);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpense(string id)
        {
            var expense = await _appDb.Expenses.FirstOrDefaultAsync(e => e.Id == id);
            if (expense != null)
            {
                _appDb.Expenses.Remove(expense);
                await _appDb.SaveChangesAsync();
                return NoContent();
            }

            expense = await _sharedDb.SharedExpenses.FirstOrDefaultAsync(e => e.Id == id);
            if (expense != null)
            {
                _sharedDb.SharedExpenses.Remove(expense);
                await _sharedDb.SaveChangesAsync();
                return NoContent();
            }

            return NotFound();
        }

        private async Task CopyRecurringFromPreviousMonth(DateTime currentMonthStart)
        {
            Console.WriteLine($"DEBUG → 🔄 Starte CopyRecurringFromPreviousMonth für {currentMonthStart:yyyy-MM-dd}");

            var alreadyCopied = await _appDb.Expenses.AnyAsync(e =>
                e.isPersonal &&
                e.isRecurring &&
                e.Date >= currentMonthStart &&
                e.Date < currentMonthStart.AddMonths(1));

            Console.WriteLine($"DEBUG → ❓ alreadyCopied im {currentMonthStart:yyyy-MM} = {alreadyCopied}");

            if (alreadyCopied)
            {
                Console.WriteLine("DEBUG → ⛔️ Kopieren abgebrochen, weil alreadyCopied = true");
                return;
            }

            var lastMonthStart = currentMonthStart.AddMonths(-1);
            var lastMonthEnd = currentMonthStart;

            Console.WriteLine($"DEBUG → 📅 Zeitraum zum Prüfen: {lastMonthStart:yyyy-MM-dd} bis {lastMonthEnd:yyyy-MM-dd}");

            var recurringLastMonth = await _appDb.Expenses
                .Where(e =>
                    e.isPersonal &&
                    e.isRecurring &&
                    e.Date >= lastMonthStart &&
                    e.Date < lastMonthEnd)
                .ToListAsync();

            Console.WriteLine($"DEBUG → 🔍 Gefundene wiederkehrende Ausgaben im Vormonat: {recurringLastMonth.Count}");

            foreach (var x in recurringLastMonth)
            {
                Console.WriteLine($"  → [Mai] {x.Name}, Betrag: {x.Amount}, Datum: {x.Date:yyyy-MM-dd}");
            }

            if (!recurringLastMonth.Any())
            {
                Console.WriteLine("DEBUG → ⚠️ Keine Einträge zum Kopieren gefunden.");
                return;
            }

            foreach (var oldExp in recurringLastMonth)
            {
                var newDate = oldExp.Date.AddMonths(1);
                var monthKeyNew = newDate.ToString("yyyy-MM");
                var yearKeyNew = newDate.Year.ToString();

                var exists = await _appDb.Expenses.AnyAsync(e =>
                    e.isPersonal &&
                    e.isRecurring &&
                    e.Date == newDate &&
                    e.Name == oldExp.Name &&
                    e.Amount == oldExp.Amount);

                Console.WriteLine($"DEBUG → Prüfe: existiert schon '{oldExp.Name}' für {newDate:yyyy-MM-dd}? {exists}");

                if (exists)
                {
                    Console.WriteLine($"DEBUG → ⚠️ Überspringe '{oldExp.Name}' – bereits vorhanden");
                    continue;
                }

                var newExpense = new Expense
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = oldExp.Name,
                    Amount = oldExp.Amount,
                    Date = newDate,
                    MonthKey = monthKeyNew,
                    YearKey = yearKeyNew,
                    Category = oldExp.Category,
                    isPersonal = oldExp.isPersonal,
                    isChild = oldExp.isChild,
                    isShared = oldExp.isShared,
                    isRecurring = oldExp.isRecurring,
                    isBalanced = false,
                    GroupId = oldExp.GroupId,
                    CreatedByUserId = oldExp.CreatedByUserId
                };

                _appDb.Expenses.Add(newExpense);
                Console.WriteLine($"DEBUG → ✅ Neue Kopie erstellt: '{newExpense.Name}' am {newExpense.Date:yyyy-MM-dd}");
            }

            await _appDb.SaveChangesAsync();
            Console.WriteLine("DEBUG → 💾 Speichern abgeschlossen (SaveChangesAsync).");
        }
    }
}
