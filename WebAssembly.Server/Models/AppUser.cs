using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WebAssembly.Server.Enums;

namespace WebAssembly.Server.Models;

public class AppUser
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    // 🔐 Auth
    public string? Email { get; set; }         // wird später Pflicht bei Registrierung
    public string? PasswordHash { get; set; }  // Bcrypt oder anderes Hashverfahren
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // 🧩 Rolle & Flags
    [Column(TypeName = "nvarchar(20)")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserRole Role { get; set; } = UserRole.Free;

    public bool IsDebugUser { get; set; } = false;
    public bool IsSuspended { get; set; } = false;
    public bool IsBetaTester { get; set; } = false;

    // 🧑‍🎨 Anzeigeoptionen
    public string? DisplayName { get; set; }
    public string? ProfileColor { get; set; }  // z. B. für UI-Akzent
    public string? AvatarUrl { get; set; }

    // 🔁 Token-basierte Auth (optional später)
    public string? AuthToken { get; set; }     // z. B. Session-Token oder API-Key

    // 📊 Statistiken / Nutzung (später)
    public int SyncCountToday { get; set; } = 0;
    public DateTime? LastSyncAt { get; set; }

    // 🔒 DSGVO / Sicherheit
    public bool IsDeleted { get; set; } = false;  // Logische Löschung
}