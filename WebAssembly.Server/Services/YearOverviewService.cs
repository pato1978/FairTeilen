using System.Globalization;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Enums;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

public class YearOverviewService
{
    private readonly SharedDbContext _sharedDb;

    public YearOverviewService(SharedDbContext sharedDb)
    {
        _sharedDb = sharedDb;
    }

    public async Task<YearOverview> GetOverviewForYearAsync(int year, string userId,string groupId)
    {
        // 📦 Initialisiere die Jahresübersicht
        var overview = new YearOverview
        {
            Year = year,
            Months = new List<MonthlyOverview>()
        };

        // 🔹 Lade alle Reaktionen für dieses Jahr (einmalig für alle Monate)
        var allReactionsForYear = await _sharedDb.ClarificationReactions
            .Where(r => r.Timestamp.Year == year)
            .ToListAsync();

        // 🔁 Iteration über alle 12 Monate
        for (int month = 1; month <= 12; month++)
        {
            var monthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month);

            // 🔹 Lade alle Ausgaben dieses Monats, die noch nicht ausgeglichen wurden
            var monthlyExpensesAll = await _sharedDb.SharedExpenses
                .Where(e => e.Date.Year == year && e.Date.Month == month && !e.isBalanced && e.CreatedByUserId != null)
                .ToListAsync();

            // 🔸 Gemeinschaftsausgaben extrahieren
            var monthlyExpensesShared = monthlyExpensesAll.Where(e => e.Type == ExpenseType.Shared).ToList();
            var totalShared = monthlyExpensesShared.Sum(e => e.Amount);
            var sharedAmountsByUser = monthlyExpensesShared
                .GroupBy(e => e.CreatedByUserId!)
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

            // 🔸 Kinderausgaben extrahieren
            var monthlyExpensesChild = monthlyExpensesAll.Where(e => e.Type == ExpenseType.Child).ToList();
            var totalChild = monthlyExpensesChild.Sum(e => e.Amount);
            var childAmountsByUser = monthlyExpensesChild
                .GroupBy(e => e.CreatedByUserId!)
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

            // 🔸 Reaktionen zu diesen Ausgaben extrahieren
            var reactionsForMonth = allReactionsForYear
                .Where(r => monthlyExpensesAll.Any(e => e.Id == r.ExpenseId))
                .ToList();

            // 🔸 Prüfe, ob irgendeine Reaktion "Rejected" ist
            bool hasClarificationNeed = reactionsForMonth.Any(r => r.Status == ClarificationStatus.Rejected);

            // 🔸 Reaktionen nach User-ID gruppieren (nur Rejected)
            var userRejections = reactionsForMonth
                .Where(r => r.Status == ClarificationStatus.Rejected)
                .GroupBy(r => r.UserId)
                .ToDictionary(g => g.Key, g => true);

            // 🔸 Bestimme Status des Monats (pending, future etc.)
            DateTime referenceMonth = new DateTime(year, month, 1);
            DateTime today = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);

            string status;

            if (hasClarificationNeed)
            {
                status = "needs-clarification";
            }
            else if (referenceMonth > today)
            {
                status = "future";
            }
            else if (referenceMonth < today)
            {
                // Vergangene Monate
                if (monthlyExpensesAll.Count == 0)
                {
                    status = "notTakenIntoAccount";
                }
                else
                {
                    status = "past"; // ✅ neuer Status für vergangene Monate mit Einträgen
                }
            }
            else
            {
                // referenceMonth == today
                status = "pending";
            }


            // 🔸 Gesamtausgaben (shared + child) je Nutzer zusammenfassen
            var totalByUser = new Dictionary<string, decimal>();
            foreach (var kvp in sharedAmountsByUser)
                totalByUser[kvp.Key] = kvp.Value;
            foreach (var kvp in childAmountsByUser)
            {
                if (!totalByUser.ContainsKey(kvp.Key))
                    totalByUser[kvp.Key] = 0;
                totalByUser[kvp.Key] += kvp.Value;
            }

            // 🔸 Saldo je Nutzer berechnen (Differenz zu allen anderen)
            var balanceByUser = totalByUser.ToDictionary(
                u => u.Key,
                u => totalByUser[u.Key] - totalByUser.Where(kvp => kvp.Key != u.Key).Sum(kvp => kvp.Value)
            );

            var monthKey = $"{year:D4}-{month:D2}";
            var yearKey = $"{year}";
            

            var monthly = new MonthlyOverview
            {
                Id = $"{groupId}_{monthKey}", // z. B. "test-group_2025-07"
                GroupId = groupId,
                MonthKey = monthKey,
                YearKey = yearKey,
                Name = monthName,
                Status = status,

                Total = totalShared + totalChild,
                Shared = totalShared,
                Child = totalChild,

                SharedByUser = sharedAmountsByUser,
                ChildByUser = childAmountsByUser,
                TotalByUser = totalByUser,
                BalanceByUser = balanceByUser,
                RejectionsByUser = userRejections
            };

            // ➕ Zur Liste hinzufügen
            overview.Months.Add(monthly);
        }

        // 📤 Rückgabe der fertigen Jahresübersicht
        return overview;
    }
}
