using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

public class InviteService : IInviteService
{
    private readonly SharedDbContext _db;
    private readonly IConfiguration _cfg;

    public InviteService(SharedDbContext db, IConfiguration cfg)
    {
        _db = db;
        _cfg = cfg;
    }

    public async Task<InviteResponse> CreateAsync(string inviterUserId, int? expiresInHours)
    {
        var code = InviteToken.GenerateCode();
        var invite = new InviteToken
        {
            Code = code,
            InviterUserId = inviterUserId,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(expiresInHours ?? 168)
        };
        _db.InviteTokens.Add(invite);
        await _db.SaveChangesAsync();

        var baseUrl = _cfg["Invite:BaseUrl"] ?? "https://app.example.com/accept-invite";
        return new InviteResponse
        {
            Code = code,
            InviteUrl = $"{baseUrl}?code={Uri.EscapeDataString(code)}",
            ExpiresAt = invite.ExpiresAt
        };
    }

    public async Task<AppUser> AcceptAsync(AcceptInviteRequest req)
    {
        var code = req.Code.Trim().ToUpperInvariant();
        var invite = await _db.InviteTokens.FirstOrDefaultAsync(i =>
            i.Code == code && i.UsedAt == null && i.ExpiresAt > DateTime.UtcNow);
        if (invite == null) throw new InvalidOperationException("Invalid or expired invite");

        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLowerInvariant()))
            throw new InvalidOperationException("Email already exists");

        var user = new AppUser
        {
            Email = req.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invite.InviterUserId,
            DisplayName = string.IsNullOrWhiteSpace(req.DisplayName) ? null : req.DisplayName.Trim()
        };

        _db.Users.Add(user);
        invite.RedeemedByUserId = user.Id;
        invite.UsedAt = DateTime.UtcNow;
        _db.InviteTokens.Update(invite);

        await _db.SaveChangesAsync();
        return user;
    }
}

