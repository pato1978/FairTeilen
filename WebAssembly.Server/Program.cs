using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using WebAssembly.Server.Data;
using WebAssembly.Server.Services;
using Hangfire;
using Hangfire.Common;
using Hangfire.SqlServer;
using WebAssembly.Server.Controllers; 

var builder = WebApplication.CreateBuilder(args);

// 🔑 Verbindung zur Shared-Datenbank (MSSQL)
var sharedConnection = builder.Configuration.GetConnectionString("SharedDb")
                    ?? throw new InvalidOperationException("❌ Verbindung 'SharedDb' ist nicht gesetzt.");

// ────────────────────────────────────────────────────────────────────────────────
// 📦 Hangfire-Services registrieren
// ────────────────────────────────────────────────────────────────────────────────
builder.Services.AddHangfire(config => config
    .UseSqlServerStorage(sharedConnection, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.FromSeconds(15),
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true
    })
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
);
builder.Services.AddHangfireServer();

// ────────────────────────────────────────────────────────────────────────────────
// 📦 Weitere Services registrieren
// ────────────────────────────────────────────────────────────────────────────────
builder.Services.AddControllers();

builder.Services.AddDbContext<SharedDbContext>(options =>
    options.UseSqlServer(sharedConnection));

builder.Services.AddScoped<YearOverviewService>();

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

// ✅ Middleware-Reihenfolge
app.UseHttpsRedirection();
app.UseRouting();

// Hangsfire-Dashboard haben wir weggelassen, siehe Anmerkung

app.UseCors();
app.UseAuthorization();

app.MapControllers();

// ────────────────────────────────────────────────────────────────────────────────
// Jetzt, nachdem `app` gebaut ist, holen wir uns per DI den IRecurringJobManager
// und legen den Cron-Job an. Dadurch ist Hangfire bereits initialisiert.
// ────────────────────────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    // Wir rufen die öffentliche Controller-Methode auf:
    recurringJobManager.AddOrUpdate(
        "monthly-copy-shared-expenses",
        Job.FromExpression<ExpensesController>(c => c.CopyRecurringSharedExpenses()),
        "5 0 1 * *",
        TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time")
    );
}

app.Run();
