using WebAssembly.Server.Models;
using System.Text.Json.Serialization;
public enum ClarificationStatus
{
    Accepted,  // Zustimmung zur Ausgabe
    Rejected   // Ablehnung / Widerspruch zur Ausgabe
    // Optional: InDiscussion, Ignored, etc.
}

public class ClarificationReaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ExpenseId { get; set; } = "";  // FK zur Ausgabe
    public string UserId { get; set; } = "";     // Wer hat reagiert?
    public string GroupId { get; set; } = "";    // NEU: Gruppenzugehörigkeit
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ClarificationStatus Status { get; set; } = ClarificationStatus.Accepted;
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}