


using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Data;

public class AppDbContext : DbContext
{   
    public DbSet<User> Users { get; set; }
   
    public DbSet<Expense> Expenses { get; set; }
    
    public DbSet<BudgetEntry> Budgets { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
}