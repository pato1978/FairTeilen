using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using WebAssembly.Server.Data;

var builder = WebApplication.CreateBuilder(args);

// 🔑 Verbindung zur Shared-Datenbank aus appsettings.Development.json
var sharedConnection = builder.Configuration.GetConnectionString("SharedDb")
                       ?? throw new InvalidOperationException("❌ Verbindung 'SharedDb' ist nicht gesetzt.");

// 📦 Services registrieren
builder.Services.AddControllers();

// 📂 Lokale SQLite-Datenbank (private Ausgaben)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=expenses.db"));

// 🌐 Zentrale MSSQL-Datenbank (gemeinsame Ausgaben)
builder.Services.AddDbContext<SharedDbContext>(options =>
    options.UseSqlServer(sharedConnection));

// 🔓 CORS für React-Frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// 🔧 Middleware
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthorization();

// 🧭 API-Endpunkte aktivieren
app.MapControllers();

app.Run();