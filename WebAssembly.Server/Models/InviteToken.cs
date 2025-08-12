using System.ComponentModel.DataAnnotations;

namespace WebAssembly.Server.Models;

public class InviteToken
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(50)]
    public string Code { get; set; } = default!;

    [Required]
    public string InviterUserId { get; set; } = default!;

    public string? RedeemedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);

    public DateTime? UsedAt { get; set; }

    // Navigation
    public AppUser? InviterUser { get; set; }
    public AppUser? RedeemedByUser { get; set; }

    public static string GenerateCode(int length = 8)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rng = new Random();
        var span = new char[length];
        for (var i = 0; i < length; i++)
            span[i] = chars[rng.Next(chars.Length)];
        return new string(span);
    }
}

