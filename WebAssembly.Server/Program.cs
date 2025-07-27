using System.Text.Json;
using System.Text.Json.Serialization;
using Hangfire;
using Hangfire.Common;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// ✅ Sichere Connection
var sharedConnection = builder.Configuration.GetConnectionString("SharedDb")
    ?? throw new InvalidOperationException("❌ Verbindung 'SharedDb' ist nicht gesetzt.");

// 🔧 Datenbank-Kontext
builder.Services.AddDbContext<SharedDbContext>(options =>
    options.UseSqlServer(sharedConnection));

// 🔧 Hangfire Setup
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
    .UseRecommendedSerializerSettings());

builder.Services.AddHangfireServer();

// 🔧 MVC / JSON Enum-Handling
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: false)
        );
    });

// 🔧 Eigene Services
builder.Services.AddScoped<YearOverviewService>();
builder.Services.AddScoped<SnapshotService>();

builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<NotificationDispatcher>();
builder.Services.AddTransient<IMailService, MailService>();

// 🔧 CORS – bei Bedarf um weitere Umgebungen erweitern
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",     // ✅ Vite Dev Server (http)
                "https://localhost"          // ✅ zusätzlich erlaubt (https für Capacitor Preview etc.)
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

//app.UseHttpsRedirection(); // funktioniert nur, wenn HTTPS im Container konfiguriert
app.UseRouting();
app.UseCors();
app.UseAuthorization();
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine("❌ UNHANDLED EXCEPTION:");
        Console.WriteLine(ex.Message);
        Console.WriteLine(ex.StackTrace);
        throw;
    }
});
app.MapControllers();

// 📅 Cron-Job für wiederkehrende Ausgaben
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

    recurringJobManager.AddOrUpdate(
        "monthly-copy-shared-expenses",
        Job.FromExpression<WebAssembly.Server.Controllers.ExpensesController>(c => c.CopyRecurringSharedExpenses()),
        "5 0 1 * *",
        TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time")
    );
}




app.Run();
