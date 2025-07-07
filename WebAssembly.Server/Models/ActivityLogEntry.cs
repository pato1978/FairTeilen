namespace WebAssembly.Server.Models;

public class ActivityLogEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string GroupId { get; set; } = default!; // z. B. "local-dev-group"
    public string UserId { get; set; } = default!;  // Wer hat die Aktion ausgelöst?
    public string? TargetUserId { get; set; }       // Optional: Wer ist betroffen?

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string ActionType { get; set; } = default!; // z. B. "Created", "Deleted", "Edited"

    public string? ExpenseId { get; set; }             // Optional, wenn relevant
    public string? DetailsJson { get; set; }           // z. B. alte Werte bei Änderung
}
