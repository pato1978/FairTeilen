using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

public class AuthService : IAuthService
{
    private readonly SharedDbContext _db;
    private readonly IConfiguration _cfg;

    public AuthService(SharedDbContext db, IConfiguration cfg)
    {
        _db = db;
        _cfg = cfg;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            throw new InvalidOperationException("Email already exists");

        string? invitedBy = null;
        if (!string.IsNullOrWhiteSpace(req.InviteCode))
        {
            var code = req.InviteCode.Trim().ToUpperInvariant();
            var invite = await _db.InviteTokens.FirstOrDefaultAsync(i =>
                i.Code == code && i.UsedAt == null && i.ExpiresAt > DateTime.UtcNow);
            if (invite == null) throw new InvalidOperationException("Invalid or expired invite");
            invitedBy = invite.InviterUserId;
        }

        var user = new AppUser
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12),
            CreatedAt = DateTime.UtcNow,
            InvitedByUserId = invitedBy,
            DisplayName = string.IsNullOrWhiteSpace(req.DisplayName) ? null : req.DisplayName.Trim()
        };

        _db.Users.Add(user);

        if (!string.IsNullOrWhiteSpace(req.InviteCode))
        {
            var code = req.InviteCode.Trim().ToUpperInvariant();
            var invite = await _db.InviteTokens.FirstAsync(i => i.Code == code);
            invite.RedeemedByUserId = user.Id;
            invite.UsedAt = DateTime.UtcNow;
            _db.InviteTokens.Update(invite);
        }

        await _db.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) throw new UnauthorizedAccessException("Invalid credentials");
        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials");

        return BuildAuthResponse(user);
    }

    private AuthResponse BuildAuthResponse(AppUser user)
    {
        var expiresMinutes = _cfg.GetValue<int?>("JWT:AccessTokenMinutes") ?? 15;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["JWT:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var now = DateTime.UtcNow;

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim("uid", user.Id)
        };

        var token = new JwtSecurityToken(
            issuer: _cfg["JWT:Issuer"],
            audience: _cfg["JWT:Audience"],
            claims: claims,
            notBefore: now,
            expires: now.AddMinutes(expiresMinutes),
            signingCredentials: creds);

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthResponse
        {
            AccessToken = jwt,
            ExpiresIn = expiresMinutes * 60,
            User = ToUserDto(user)
        };
    }

    public UserDto ToUserDto(AppUser u) => new()
    {
        Id = u.Id,
        Email = u.Email ?? string.Empty,
        DisplayName = u.DisplayName,
        GroupId = u.GroupId,
        CreatedAt = u.CreatedAt,
        InvitedByUserId = u.InvitedByUserId
    };
}

