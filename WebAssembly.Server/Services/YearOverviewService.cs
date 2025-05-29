using System.Globalization;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

    
namespace WebAssembly.Server.Services;

public class YearOverviewService
{
    
    private readonly SharedDbContext _sharedDb;

    public YearOverviewService( SharedDbContext sharedDb)
    {
        
        _sharedDb = sharedDb;
    }
        public async Task<YearOverview> GetOverviewForYearAsync(int year, string userId)
        {   
            var overview = new YearOverview
            {
                Year = year,
                Months = new List<MonthlyOverview>()
            };

            for (int month = 1; month <= 12; month++)
            {
                var monthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month);
                
                DateTime vergleichsmonat = new DateTime(year, month, 1);
                DateTime heute = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
                var status = (vergleichsmonat > heute) ? "future" : "pending";
                
                int currentMonth = month;
                var monthlyExpensesAll = await _sharedDb.SharedExpenses
                    .Where(e => e.Date.Year == year && e.Date.Month == currentMonth&& !e.isBalanced).ToListAsync();
                
                
                var monthlyExpensesShared =
                    monthlyExpensesAll.Where(e => e.isShared ).ToList();
                var totalShared = monthlyExpensesShared.Sum(e => e.Amount);
                
                var monthlyExpensesSharedUser1= monthlyExpensesShared.
                    Where(expense => expense.CreatedByUserId == userId).ToList();
                var totalSharedUser1 = monthlyExpensesSharedUser1.Sum(e => e.Amount);
                var monthlyExpensesSharedUser2 = monthlyExpensesShared.
                    Where(expense => expense.CreatedByUserId != userId).ToList();
                var totalSharedUser2 = monthlyExpensesSharedUser2.Sum(e => e.Amount);
                
                
                var monthlyExpensesChild =
                    monthlyExpensesAll.Where(e => e.isChild );
                var totalChild = monthlyExpensesChild.Sum(e => e.Amount);
                var monthlyExpensesChildUser1 = monthlyExpensesChild.
                    Where(expense => expense.CreatedByUserId == userId).ToList();
                var totalChildUser1 = monthlyExpensesChildUser1.Sum(e => e.Amount);
                var monthlyExpensesChildUser2 = monthlyExpensesChild.
                    Where(expense => expense.CreatedByUserId != userId).ToList();
                var totalChildUser2 = monthlyExpensesChildUser2.Sum(e => e.Amount);


                var hasClarificationNeed = monthlyExpensesAll
                    .Any(expense => expense.ClarificationReactions != null && 
                                    expense.ClarificationReactions.Any(r => r.Status == ClarificationStatus.Rejected));


                if (hasClarificationNeed)
                    status = "needs-clarification";
                
                var clarificationReactionsList = monthlyExpensesAll
                    .Where(expense => expense.ClarificationReactions != null)
                    .SelectMany(expense => expense.ClarificationReactions
                        .Where(r => r.Status == ClarificationStatus.Rejected))
                    .ToList();



                
                var monthly = new MonthlyOverview
                {
                    MonthId = month,
                    Name = monthName,
                    Status = status, // TODO: Status berechnen
                    User1Confirmed = false, // TODO: aus DB oder Berechnung
                    User2Confirmed = false, // TODO: aus DB oder Berechnung
                    Total = totalShared+totalChild,      // TODO: berechnen
                    Shared = totalShared,     // TODO: berechnen
                    SharedUser1 = totalSharedUser1,
                    SharedUser2 = totalSharedUser2,
                    Child = totalChild,      // TODO: berechnen
                    ChildUser1 = totalChildUser1,
                    ChildUser2 = totalChildUser2,
                    Balance = (totalChildUser1+totalSharedUser1)-(totalChildUser2+totalSharedUser2),    // TODO: berechnen
                    ClarificationReactionsList = clarificationReactionsList  // TODO: Konflikthinweis ggf. setzen
                };

                // TODO: Daten aus DB laden und Felder oben befüllen

                overview.Months.Add(monthly);
            }

            return overview;
        }
        
        
   
}