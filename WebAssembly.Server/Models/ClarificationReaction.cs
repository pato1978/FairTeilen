using Microsoft.AspNetCore.Http.HttpResults;

namespace WebAssembly.Server.Models;
public enum ClarificationStatus
{
      // Noch keine Entscheidung getroffen
    Accepted,    // Zustimmung zur Ausgabe
    Rejected     // Ablehnung / Widerspruch zur Ausgabe
    // Später z. B. "InDiscussion", "Ignored" usw.
}
public class ClarificationReaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ExpenseId { get; set; } = "";  // FK zur Ausgabe
    public string UserId { get; set; } = "";     // Wer hat reagiert?
    public ClarificationStatus Status { get; set; } = ClarificationStatus.Accepted;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}