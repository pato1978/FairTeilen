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
    
    public YearOverviewService(SharedDbContext sharedDb, SnapshotService snapshotService)
    {
        _sharedDb = sharedDb;
        _snapshotService = snapshotService;
    }

    /// <summary>
    /// OPTIMIERT: Lädt alle Daten für das Jahr in einem Durchgang
    /// </summary>
    public async Task<YearOverview> GetOverviewForYearAsync(int year, string userId, string groupId)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        Console.WriteLine($"[PERF] Start GetOverviewForYearAsync für {year}");

        var overview = new YearOverview
        {
            Year = year,
            Months = new List<MonthlyOverview>()
        };

        // 1. Alle Snapshots für das Jahr in EINEM Query laden
        var yearStart = new DateTime(year, 1, 1);
        var yearEnd = new DateTime(year + 1, 1, 1);
        
        var allSnapshots = await _sharedDb.MonthlyOverviewSnapshots
            .Where(s => s.GroupId == groupId && 
                       s.Month.StartsWith(year.ToString()))
            .ToDictionaryAsync(s => s.Month);
            
        Console.WriteLine($"[PERF] Snapshots geladen: {sw.ElapsedMilliseconds}ms");

        // 2. Alle Ausgaben für das ganze Jahr in EINEM Query laden
        var allExpenses = await _sharedDb.SharedExpenses
            .Where(e => e.Date >= yearStart && 
                       e.Date < yearEnd && 
                       !e.isBalanced && 
                       e.CreatedByUserId != null)
            .ToListAsync();
            
        Console.WriteLine($"[PERF] {allExpenses.Count} Ausgaben geladen: {sw.ElapsedMilliseconds}ms");

        // 3. Alle Reaktionen für diese Ausgaben in EINEM Query laden
        var expenseIds = allExpenses.Select(e => e.Id).ToList();
        var allReactions = await _sharedDb.ClarificationReactions
            .Where(r => expenseIds.Contains(r.ExpenseId))
            .ToListAsync();
            
        Console.WriteLine($"[PERF] {allReactions.Count} Reaktionen geladen: {sw.ElapsedMilliseconds}ms");

        // 4. Gruppiere Daten nach Monat im Speicher
        var expensesByMonth = allExpenses
            .GroupBy(e => e.Date.Month)
            .ToDictionary(g => g.Key, g => g.ToList());
            
        var reactionsByExpenseId = allReactions
            .GroupBy(r => r.ExpenseId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var today = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);

        // 5. Erstelle Monatsübersichten mit vorgeladenen Daten
        for (int month = 1; month <= 12; month++)
        {
            var monthKey = $"{year:D4}-{month:D2}";
            
            // Prüfe Snapshot
            if (allSnapshots.TryGetValue(monthKey, out var snapshot))
            {
                var snapshotData = System.Text.Json.JsonSerializer.Deserialize<SnapshotData>(snapshot.SnapshotJson);
                overview.Months.Add(new MonthlyOverview
                {
                    Id = $"{groupId}_{monthKey}",
                    GroupId = groupId,
                    MonthKey = monthKey,
                    YearKey = year.ToString(),
                    Name = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                    Status = "completed",
                    Total = snapshotData.TotalExpenses,
                    Shared = snapshotData.SharedExpenses,
                    Child = snapshotData.ChildExpenses,
                    TotalByUser = snapshotData.ExpensesByUser,
                    SharedByUser = snapshotData.SharedByUser,
                    ChildByUser = snapshotData.ChildByUser,
                    BalanceByUser = snapshotData.BalanceByUser,
                    RejectionsByUser = snapshotData.RejectedByUser?.ToDictionary(id => id, id => true) ?? new Dictionary<string, bool>()
                });
                continue;
            }

            // Berechne Monat aus vorgeladenen Daten
            var monthExpenses = expensesByMonth.GetValueOrDefault(month) ?? new List<Expense>();
            var monthReactions = monthExpenses
                .SelectMany(e => reactionsByExpenseId.GetValueOrDefault(e.Id) ?? new List<ClarificationReaction>())
                .ToList();

            var monthly = CalculateMonthFromData(
                year, month, monthExpenses, monthReactions, today, groupId
            );
            
            overview.Months.Add(monthly);
        }

        Console.WriteLine($"[PERF] Gesamt-Laufzeit: {sw.ElapsedMilliseconds}ms");
        return overview;
    }

    /// <summary>
    /// Berechnet eine Monatsübersicht aus vorgeladenen Daten
    /// </summary>
    private MonthlyOverview CalculateMonthFromData(
        int year, 
        int month, 
        List<Expense> expenses, 
        List<ClarificationReaction> reactions,
        DateTime today,
        string groupId)
    {
        var monthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month);
        var monthKey = $"{year:D4}-{month:D2}";
        var reference = new DateTime(year, month, 1);

        // Gruppiere Ausgaben
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

        // Gesamt je User
        var totalByUser = new Dictionary<string, decimal>();
        foreach (var kv in sharedByUser)
            totalByUser[kv.Key] = kv.Value;
        foreach (var kv in childByUser)
        {
            if (!totalByUser.ContainsKey(kv.Key))
                totalByUser[kv.Key] = 0;
            totalByUser[kv.Key] += kv.Value;
        }

        // Saldenberechnung
        var balanceByUser = totalByUser.ToDictionary(
            u => u.Key,
            u => totalByUser[u.Key] - totalByUser.Where(kvp => kvp.Key != u.Key).Sum(kvp => kvp.Value)
        );

        // Rejected-Reaktionen
        var rejected = reactions
            .Where(r => r.Status == ClarificationStatus.Rejected)
            .GroupBy(r => r.UserId)
            .ToDictionary(g => g.Key, g => true);

        // Status bestimmen
        string status;
        if (rejected.Any())
        {
            status = "needs-clarification";
        }
        else if (reference > today)
        {
            status = "future";
        }
        else if (reference < today)
        {
            status = expenses.Count == 0 ? "notTakenIntoAccount" : "past";
        }
        else
        {
            status = "pending";
        }

        return new MonthlyOverview
        {
            Id = $"{groupId}_{monthKey}",
            GroupId = groupId,
            MonthKey = monthKey,
            YearKey = year.ToString(),
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

    /// <summary>
    /// Einzelne Monatsabfrage (falls noch benötigt)
    /// </summary>
    public async Task<MonthlyOverview> GetOverviewForMonthAsync(int year, int month, string userId, string groupId)
    {
        var monthKey = $"{year:D4}-{month:D2}";
        
        // Prüfe Snapshot
        var snapshot = await _snapshotService.LoadSnapshotAsync(groupId, monthKey);
        if (snapshot != null)
        {
            return new MonthlyOverview
            {
                Id = $"{groupId}_{monthKey}",
                GroupId = groupId,
                MonthKey = monthKey,
                YearKey = year.ToString(),
                Name = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                Status = "completed",
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

        // Lade Daten für einzelnen Monat
        var monthStart = new DateTime(year, month, 1);
        var monthEnd = monthStart.AddMonths(1);
        
        var expenses = await _sharedDb.SharedExpenses
            .Where(e => e.Date >= monthStart && e.Date < monthEnd && !e.isBalanced && e.CreatedByUserId != null)
            .ToListAsync();

        var expenseIds = expenses.Select(e => e.Id).ToList();
        var reactions = await _sharedDb.ClarificationReactions
            .Where(r => expenseIds.Contains(r.ExpenseId))
            .ToListAsync();

        var today = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
        
        
         var monthly=    CalculateMonthFromData(year, month, expenses, reactions, today, groupId);
         monthly.Expenses = expenses;
         return monthly;
    }
}