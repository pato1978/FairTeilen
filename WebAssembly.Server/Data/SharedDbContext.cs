using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Models;
namespace WebAssembly.Server.Data
{
    public class SharedDbContext : DbContext
    {
        public DbSet<Expense> SharedExpenses { get; set; }
        public DbSet<BudgetEntry> SharedBudgets { get; set; }
        public DbSet<User> SharedUsers { get; set; }
        public SharedDbContext(DbContextOptions<SharedDbContext> options)
            : base(options)
        {
        }

        
    }
}