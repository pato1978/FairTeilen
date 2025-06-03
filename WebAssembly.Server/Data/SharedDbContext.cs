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
        public DbSet<ClarificationReaction> ClarificationReactions { get; set; } // ✅ singular

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ✅ Beziehung zwischen Reaction und Expense
            modelBuilder.Entity<ClarificationReaction>()
                .HasOne(r => r.Expense)
                .WithMany() // oder .WithMany(e => e.ClarificationReactions), wenn du Rückbeziehung willst
                .HasForeignKey(r => r.ExpenseId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ Status-Feld ist Pflicht
            modelBuilder.Entity<ClarificationReaction>()
                .Property(c => c.Status)
                .IsRequired();
        }


        public SharedDbContext(DbContextOptions<SharedDbContext> options)
            : base(options)
        {
        }
    }
}