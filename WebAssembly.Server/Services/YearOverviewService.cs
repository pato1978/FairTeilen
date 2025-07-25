using System.Globalization;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Enums;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

/// <summary>
/// Liefert eine aggregierte Übersicht über ein Kalenderjahr,
/// einschließlich Monatsdaten, Reaktionen, Ausgaben und Bestätigungen.
/// </summary>
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
    /// OPTIMIERT: Lädt alle Monatsdaten eines Jahres (inkl. Reaktionen, Snapshots, Bestätigungen)
    /// in einem einzigen Durchgang aus der Datenbank und aggregiert sie zu einer Jahresübersicht.
    /// </summary>
    public async Task<YearOverview> GetOverviewForYearAsync(int year, string userId, string groupId)
{
    // ✅ GroupId-Validierung
    if (string.IsNullOrWhiteSpace(groupId))
    {
        throw new ArgumentException("GroupId ist erforderlich für Jahresübersicht");
    }

    var sw = System.Diagnostics.Stopwatch.StartNew();
    Console.WriteLine($"[PERF] Start GetOverviewForYearAsync für {year}, Gruppe: {groupId}");

    var overview = new YearOverview
    {
        Year = year,
        Months = new List<MonthlyOverview>()
    };

    var yearStart = new DateTime(year, 1, 1);
    var yearEnd = new DateTime(year + 1, 1, 1);

    // 1. Snapshots laden (optimiert nach MonatKey gruppiert)
    var allSnapshots = await _sharedDb.MonthlyOverviewSnapshots
        .Where(s => s.GroupId == groupId && s.Month.StartsWith(year.ToString()))
        .ToDictionaryAsync(s => s.Month);
    Console.WriteLine($"[PERF] {allSnapshots.Count} Snapshots geladen für Gruppe {groupId}: {sw.ElapsedMilliseconds}ms");

    // 2. ✅ KORRIGIERT: Alle Ausgaben des Jahres MIT GroupId-Filter laden
    var allExpenses = await _sharedDb.SharedExpenses
        .Where(e => e.Date >= yearStart 
                && e.Date < yearEnd 
                && !e.isBalanced 
                && e.CreatedByUserId != null
                && e.GroupId == groupId)  // ✅ GroupId-Filter hinzugefügt
        .ToListAsync();
    
    Console.WriteLine($"[PERF] {allExpenses.Count} Ausgaben geladen für Gruppe {groupId}: {sw.ElapsedMilliseconds}ms");
    
    // ✅ Debug: Prüfe ob wirklich nur eine GroupId geladen wurde
    var loadedGroupIds = allExpenses.Select(e => e.GroupId).Distinct().ToList();
    if (loadedGroupIds.Count > 1)
    {
        Console.WriteLine($"⚠️ WARNUNG: Ausgaben aus {loadedGroupIds.Count} verschiedenen Gruppen gefunden: {string.Join(", ", loadedGroupIds)}");
    }
    else if (loadedGroupIds.Count == 1 && loadedGroupIds[0] != groupId)
    {
        Console.WriteLine($"⚠️ WARNUNG: Geladene GroupId ({loadedGroupIds[0]}) stimmt nicht mit angeforderter GroupId ({groupId}) überein!");
    }

    // 3. Alle Reaktionen zu diesen Ausgaben laden
    var expenseIds = allExpenses.Select(e => e.Id).ToList();
    var allReactions = await _sharedDb.ClarificationReactions
        .Where(r => expenseIds.Contains(r.ExpenseId))
        .ToListAsync();
    Console.WriteLine($"[PERF] {allReactions.Count} Reaktionen geladen: {sw.ElapsedMilliseconds}ms");

    // 4. Alle Bestätigungen für dieses Jahr laden
    var allConfirmations = await _sharedDb.MonthlyConfirmations
        .Where(c => c.GroupId == groupId && c.MonthKey.StartsWith(year.ToString()))
        .ToListAsync();

    var confirmationsByMonth = allConfirmations
        .GroupBy(c => c.MonthKey)
        .ToDictionary(
            g => g.Key,
            g => g.ToDictionary(c => c.UserId, c => c.Confirmed)
        );
    Console.WriteLine($"[PERF] {allConfirmations.Count} Bestätigungen geladen für Gruppe {groupId}: {sw.ElapsedMilliseconds}ms");

    // 5. Gruppiere Ausgaben und Reaktionen im Arbeitsspeicher
    var expensesByMonth = allExpenses
        .GroupBy(e => e.Date.Month)
        .ToDictionary(g => g.Key, g => g.ToList());

    var reactionsByExpenseId = allReactions
        .GroupBy(r => r.ExpenseId)
        .ToDictionary(g => g.Key, g => g.ToList());

    var today = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);

    // 6. Monatsübersichten generieren
    for (int month = 1; month <= 12; month++)
    {
        var monthKey = $"{year:D4}-{month:D2}";

        // 6.1. Snapshot verwenden, falls vorhanden
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
                RejectionsByUser = snapshotData.RejectedByUser?.ToDictionary(id => id, _ => true) ?? new(),
                ConfirmationsByUser = confirmationsByMonth.GetValueOrDefault(monthKey) ?? new()
            });

            continue;
        }

        // 6.2. Daten berechnen, wenn kein Snapshot vorliegt
        var monthExpenses = expensesByMonth.GetValueOrDefault(month) ?? new();
        var monthReactions = monthExpenses
            .SelectMany(e => reactionsByExpenseId.GetValueOrDefault(e.Id) ?? new List<ClarificationReaction>())
            .ToList();

        var monthly = CalculateMonthFromData(year, month, monthExpenses, monthReactions, today, groupId);
        monthly.Expenses = monthExpenses;
        monthly.ConfirmationsByUser = confirmationsByMonth.GetValueOrDefault(monthKey) ?? new();

        overview.Months.Add(monthly);
    }

    Console.WriteLine($"[PERF] Gesamt-Laufzeit für Jahr {year}, Gruppe {groupId}: {sw.ElapsedMilliseconds}ms");
    return overview;
}

    /// <summary>
    /// Berechnet eine Monatsübersicht aus bereits vorgeladenen Ausgaben und Reaktionen.
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

        var shared = expenses.Where(e => e.Type == ExpenseType.Shared).ToList();
        var child = expenses.Where(e => e.Type == ExpenseType.Child).ToList();

        var totalShared = shared.Sum(e => e.Amount);
        var totalChild = child.Sum(e => e.Amount);

        var sharedByUser = shared.GroupBy(e => e.CreatedByUserId!)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

        var childByUser = child.GroupBy(e => e.CreatedByUserId!)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

        var totalByUser = new Dictionary<string, decimal>();
        foreach (var kv in sharedByUser)
            totalByUser[kv.Key] = kv.Value;
        foreach (var kv in childByUser)
        {
            if (!totalByUser.ContainsKey(kv.Key))
                totalByUser[kv.Key] = 0;
            totalByUser[kv.Key] += kv.Value;
        }

        var balanceByUser = totalByUser.ToDictionary(
            u => u.Key,
            u => totalByUser[u.Key] - totalByUser.Where(kvp => kvp.Key != u.Key).Sum(kvp => kvp.Value)
        );

        var rejected = reactions
            .Where(r => r.Status == ClarificationStatus.Rejected)
            .GroupBy(r => r.UserId)
            .ToDictionary(g => g.Key, _ => true);

        string status;
        if (rejected.Any())
            status = "needs-clarification";
        else if (reference > today)
            status = "future";
        else if (reference < today)
            status = expenses.Count == 0 ? "notTakenIntoAccount" : "past";
        else
            status = "pending";

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
            // ConfirmationsByUser wird außerhalb zugewiesen
        };
    }

    /// <summary>
    /// Lädt eine Einzelübersicht für einen bestimmten Monat, inkl. Snapshot oder dynamischer Berechnung.
    /// </summary>
    public async Task<MonthlyOverview> GetOverviewForMonthAsync(int year, int month, string userId, string groupId)
{
    // ✅ GroupId-Validierung
    if (string.IsNullOrWhiteSpace(groupId))
    {
        throw new ArgumentException("GroupId ist erforderlich für Monatsübersicht");
    }

    Console.WriteLine($"📊 GetOverviewForMonthAsync: year={year}, month={month}, userId={userId}, groupId={groupId}");

    var monthKey = $"{year:D4}-{month:D2}";

    // 1. Snapshot bevorzugen
    var snapshot = await _snapshotService.LoadSnapshotAsync(groupId, monthKey);
    if (snapshot != null)
    {
        Console.WriteLine($"📸 Verwende Snapshot für {monthKey}, Gruppe {groupId}");
        
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
            RejectionsByUser = snapshot.RejectedByUser?.ToDictionary(id => id, _ => true) ?? new(),
            ConfirmationsByUser = (await _sharedDb.MonthlyConfirmations
                .Where(c => c.GroupId == groupId && c.MonthKey == monthKey)
                .ToDictionaryAsync(c => c.UserId, c => c.Confirmed))
        };
    }

    // 2. Fallback: dynamisch berechnen
    var monthStart = new DateTime(year, month, 1);
    var monthEnd = monthStart.AddMonths(1);

    // ✅ KORRIGIERT: Mit GroupId-Filter
    var expenses = await _sharedDb.SharedExpenses
        .Where(e => e.Date >= monthStart 
                && e.Date < monthEnd 
                && !e.isBalanced 
                && e.CreatedByUserId != null
                && e.GroupId == groupId)  // ✅ GroupId-Filter hinzugefügt
        .ToListAsync();

    Console.WriteLine($"📊 {expenses.Count} Ausgaben für {monthKey} geladen, Gruppe {groupId}");

    // ✅ Debug: Validiere GroupIds
    var loadedGroupIds = expenses.Select(e => e.GroupId).Distinct().ToList();
    if (loadedGroupIds.Count > 1)
    {
        Console.WriteLine($"⚠️ WARNUNG: Ausgaben aus {loadedGroupIds.Count} verschiedenen Gruppen in Monat {monthKey}: {string.Join(", ", loadedGroupIds)}");
    }

    var expenseIds = expenses.Select(e => e.Id).ToList();
    var reactions = await _sharedDb.ClarificationReactions
        .Where(r => expenseIds.Contains(r.ExpenseId))
        .ToListAsync();

    var confirmations = await _sharedDb.MonthlyConfirmations
        .Where(c => c.GroupId == groupId && c.MonthKey == monthKey)
        .ToDictionaryAsync(c => c.UserId, c => c.Confirmed);

    var today = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);

    var monthly = CalculateMonthFromData(year, month, expenses, reactions, today, groupId);
    monthly.Expenses = expenses;
    monthly.ConfirmationsByUser = confirmations;

    return monthly;
}
}
