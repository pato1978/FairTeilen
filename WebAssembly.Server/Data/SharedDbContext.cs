using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Models;
namespace WebAssembly.Server.Data
{
    public class SharedDbContext : DbContext
    {
        public DbSet<Expense> SharedExpenses { get; set; }
        public DbSet<BudgetEntry> SharedBudgets { get; set; }
        public DbSet<User> SharedUsers { get; set; }
        public DbSet<YearOverview> SharedYearOverviews { get; set; }
        public DbSet<MonthlyOverview> SharedMonthlyOverviews { get; set; }
        public DbSet<ClarificationReactions> ClarificationReactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<MonthlyOverview>()
                .HasMany(m => m.ClarificationReactionsList)
                .WithOne() // kein Navigationsproperty zurück
                .HasForeignKey("MonthlyOverviewId") // Shadow Property
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ClarificationReactions>()
                .Property(c => c.Status)
                .IsRequired();
        }
        public SharedDbContext(DbContextOptions<SharedDbContext> options)
            : base(options)
        {
        }

        
    }
}