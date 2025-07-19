using System.Globalization;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Enums;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

public class YearOverviewService
{
    private readonly SharedDbContext _sharedDb;
    private readonly SnapshotService _snapshotService;
    public YearOverviewService(SharedDbContext sharedDb,SnapshotService snapshotService)
    {
        _sharedDb = sharedDb;
        _snapshotService = snapshotService;
    }

    /// <summary>
    /// Berechnet die Übersicht für ein gesamtes Jahr – 12 Monate.
    /// </summary>
    public async Task<YearOverview> GetOverviewForYearAsync(int year, string userId, string groupId)
    {
        var overview = new YearOverview
        {
            Year = year,
            Months = new List<MonthlyOverview>()
        };

        for (int month = 1; month <= 12; month++)
        {   
            
            var monthly = await GetOverviewForMonthAsync(year, month, userId, groupId);
            overview.Months.Add(monthly);
        }

        return overview;
    }

    /// <summary>
    /// Berechnet die Monatsübersicht für einen bestimmten Monat und eine Gruppe.
    /// </summary>
    public async Task<MonthlyOverview> GetOverviewForMonthAsync(int year, int month, string userId, string groupId)
    {
        
        
        
        
        var monthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month);
        var monthKey = $"{year:D4}-{month:D2}";
        var yearKey = $"{year}";

        var today = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
        var reference = new DateTime(year, month, 1);
        
        var snapshot = await _snapshotService.LoadSnapshotAsync(groupId, monthKey);
        if (snapshot != null)
        {
            return new MonthlyOverview()
            {
                Id = $"{groupId}_{monthKey}",
                GroupId = groupId,
                MonthKey = monthKey,
                YearKey = yearKey,
                Name = monthName,
                Status = "completed", // 👈 oder z. B. "archived"
                Total = snapshot.TotalExpenses,
                Shared = snapshot.SharedExpenses,
                Child = snapshot.ChildExpenses,
                TotalByUser = snapshot.ExpensesByUser,
                SharedByUser = snapshot.SharedByUser,
                ChildByUser = snapshot.ChildByUser,
                BalanceByUser = snapshot.BalanceByUser,
                RejectionsByUser = snapshot.RejectedByUser?.ToDictionary(id => id, id => true) ?? new Dictionary<string, bool>()
            };

        }
        else
        {


            // 🔹 Reaktionen laden
            var reactions = await _sharedDb.ClarificationReactions
                .Where(r => r.Timestamp.Year == year && r.Timestamp.Month == month)
                .ToListAsync();

            // 🔹 Ausgaben laden
            var expenses = await _sharedDb.SharedExpenses
                .Where(e => e.Date.Year == year && e.Date.Month == month && !e.isBalanced && e.CreatedByUserId != null)
                .ToListAsync();

            // 🔸 Gruppieren nach Typ
            var shared = expenses.Where(e => e.Type == ExpenseType.Shared).ToList();
            var child = expenses.Where(e => e.Type == ExpenseType.Child).ToList();

            var totalShared = shared.Sum(e => e.Amount);
            var totalChild = child.Sum(e => e.Amount);

            var sharedByUser = shared
                .GroupBy(e => e.CreatedByUserId!)
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

            var childByUser = child
                .GroupBy(e => e.CreatedByUserId!)
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

            // 🔸 Gesamt je User
            var totalByUser = new Dictionary<string, decimal>();
            foreach (var kv in sharedByUser)
                totalByUser[kv.Key] = kv.Value;
            foreach (var kv in childByUser)
            {
                if (!totalByUser.ContainsKey(kv.Key))
                    totalByUser[kv.Key] = 0;
                totalByUser[kv.Key] += kv.Value;
            }

            // 🔸 Saldenberechnung
            var balanceByUser = totalByUser.ToDictionary(
                u => u.Key,
                u => totalByUser[u.Key] - totalByUser.Where(kvp => kvp.Key != u.Key).Sum(kvp => kvp.Value)
            );

            // 🔸 Rejected-Reaktionen extrahieren
            var rejected = reactions
                .Where(r => r.Status == ClarificationStatus.Rejected)
                .GroupBy(r => r.UserId)
                .ToDictionary(g => g.Key, g => true);

            // 🔸 Status bestimmen
            string status;
            if (rejected.Any())
                status = "needs-clarification";
            else if (reference > today)
                status = "future";
            else if (reference < today && expenses.Count == 0)
                status = "notTakenIntoAccount";
            else if (reference < today)
                status = "past";
            else
                status = "pending";

            // 🔁 Monatsobjekt zusammenbauen
            return new MonthlyOverview
            {
                Id = $"{groupId}_{monthKey}",
                GroupId = groupId,
                MonthKey = monthKey,
                YearKey = yearKey,
                Name = monthName,
                Status = status,
                Total = totalShared + totalChild,
                Shared = totalShared,
                Child = totalChild,
                SharedByUser = sharedByUser,
                ChildByUser = childByUser,
                TotalByUser = totalByUser,
                BalanceByUser = balanceByUser,
                RejectionsByUser = rejected
            };
        }
    }
}
