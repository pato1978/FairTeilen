using System.Globalization;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

public class YearOverviewService
{
    private readonly SharedDbContext _sharedDb;

    public YearOverviewService(SharedDbContext sharedDb)
    {
        _sharedDb = sharedDb;
    }

    public async Task<YearOverview> GetOverviewForYearAsync(int year, string userId)
    {
        // Erstelle eine neue Übersicht für das Jahr
        var overview = new YearOverview
        {
            Year = year,
            Months = new List<MonthlyOverview>()
        };

        // 🔹 Lade alle Reaktionen im angegebenen Jahr (getrennt vom Expense)
        var allReactionsForYear = await _sharedDb.ClarificationReactions
            .Where(r => r.Timestamp.Year == year)
            .ToListAsync();

        // Schleife über alle 12 Monate
        for (int month = 1; month <= 12; month++)
        {
            // Monatsname wie "Januar", "Februar", ...
            var monthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month);

           

            // 🔹 Lade alle Ausgaben dieses Monats (nicht ausgeglichen)
            var monthlyExpensesAll = await _sharedDb.SharedExpenses
                .Where(e => e.Date.Year == year && e.Date.Month == month && !e.isBalanced)
                .ToListAsync();

            // 🔹 Gemeinschaftsausgaben
            var monthlyExpensesShared = monthlyExpensesAll.Where(e => e.isShared).ToList();
            var totalShared = monthlyExpensesShared.Sum(e => e.Amount);

            // 🔹 Aufteilung Gemeinschaftsausgaben nach User
            var sharedUser1 = monthlyExpensesShared.Where(e => e.CreatedByUserId == userId).ToList();
            var sharedUser2 = monthlyExpensesShared.Where(e => e.CreatedByUserId != userId).ToList();
            var totalSharedUser1 = sharedUser1.Sum(e => e.Amount);
            var totalSharedUser2 = sharedUser2.Sum(e => e.Amount);

            // 🔹 Ausgaben für Kinder
            var monthlyExpensesChild = monthlyExpensesAll.Where(e => e.isChild).ToList();
            var totalChild = monthlyExpensesChild.Sum(e => e.Amount);

            // 🔹 Aufteilung Kinderausgaben nach User
            var childUser1 = monthlyExpensesChild.Where(e => e.CreatedByUserId == userId).ToList();
            var childUser2 = monthlyExpensesChild.Where(e => e.CreatedByUserId != userId).ToList();
            var totalChildUser1 = childUser1.Sum(e => e.Amount);
            var totalChildUser2 = childUser2.Sum(e => e.Amount);

            // 🔹 Reaktionen in diesem Monat (auf die vorhandenen Ausgaben bezogen)
            var reactionsForMonth = allReactionsForYear
                .Where(r => monthlyExpensesAll.Any(e => e.Id == r.ExpenseId))
                .ToList();

            // 🔹 Wenn mindestens eine Reaktion "Rejected" ist → Klärungsbedarf
            bool hasClarificationNeed = reactionsForMonth
                .Any(r => r.Status == ClarificationStatus.Rejected);
            
            var user1Confirmed = hasClarificationNeed && reactionsForMonth.Any(r => r.UserId == userId); 
            var user2Confirmed = hasClarificationNeed && reactionsForMonth.Any(r => r.UserId != userId);
            
            // Vergleiche: liegt dieser Monat in der Zukunft?
            DateTime referenceMonth = new DateTime(year, month, 1);
            DateTime today = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            string status;
            
            if (hasClarificationNeed)
                status = "needs-clarification";
            else if (referenceMonth > today)
                status = "future";
            else if (referenceMonth < today && monthlyExpensesAll.Count == 0)
                status = "notTakenIntoAccount";
            else
                status = "pending";
            
            
            
            // 🔹 Monatsübersicht erstellen
            var monthly = new MonthlyOverview
            {
                MonthId = month,
                Name = monthName,
                Status = status,

                User1Confirmed = user1Confirmed, // (wird später gesetzt)
                User2Confirmed = user2Confirmed,

                Total = totalShared + totalChild,
                Shared = totalShared,
                SharedUser1 = totalSharedUser1,
                SharedUser2 = totalSharedUser2,
                Child = totalChild,
                ChildUser1 = totalChildUser1,
                ChildUser2 = totalChildUser2,

                Balance = (totalChildUser1 + totalSharedUser1) - (totalChildUser2 + totalSharedUser2)
            };

            // ➕ Monatsübersicht zur Jahresübersicht hinzufügen
            overview.Months.Add(monthly);
        }

        // 📤 Rückgabe der vollständigen Jahresübersicht
        return overview;
    }
}
