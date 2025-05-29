using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using WebAssembly.Server.Data;
using WebAssembly.Server.Services;
var builder = WebApplication.CreateBuilder(args);

// 🔑 Verbindung zur Shared-Datenbank
var sharedConnection = builder.Configuration.GetConnectionString("SharedDb")
                       ?? throw new InvalidOperationException("❌ Verbindung 'SharedDb' ist nicht gesetzt.");

// 📦 Services
builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=expenses.db"));

builder.Services.AddDbContext<SharedDbContext>(options =>
    options.UseSqlServer(sharedConnection));
builder.Services.AddScoped<YearOverviewService>();
// ✅ CORS korrekt konfigurieren
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// ✅ Wichtige Reihenfolge!
app.UseHttpsRedirection();
app.UseRouting();       // <--- 🔥 MUSS VOR UseCors()
app.UseCors();          // <--- 🔥 DANACH!
app.UseAuthorization();

app.MapControllers();

app.Run();