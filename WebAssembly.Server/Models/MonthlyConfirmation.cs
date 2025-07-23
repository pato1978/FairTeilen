
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebAssembly.Server.Models;

/// <summary>
/// Speichert die Monatsbestätigung eines einzelnen Nutzers pro Monat und Gruppe.
/// </summary>
public class MonthlyConfirmation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = default!;

    [Required]
    public string GroupId { get; set; } = default!;

    /// <summary>
    /// Monatsschlüssel im Format \"YYYY-MM\", z. B. \"2025-07\"
    /// </summary>
    [Required]
    public string MonthKey { get; set; } = default!;

    public bool Confirmed { get; set; } = true;

    /// <summary>
    /// Zeitpunkt der Bestätigung (UTC)
    /// </summary>
    public DateTime? ConfirmedAt { get; set; } = DateTime.UtcNow;
}

