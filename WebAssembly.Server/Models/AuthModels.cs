using System.ComponentModel.DataAnnotations;

namespace WebAssembly.Server.Models;

public class RegisterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    public string? InviteCode { get; set; }
    public string? DisplayName { get; set; }
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public UserDto User { get; set; } = new();
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? GroupId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? InvitedByUserId { get; set; }
}

public class CreateInviteRequest
{
    public int? ExpiresInHours { get; set; } = 168;
}

public class InviteResponse
{
    public string Code { get; set; } = string.Empty;
    public string InviteUrl { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class AcceptInviteRequest
{
    [Required]
    public string Code { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    public string? DisplayName { get; set; }
}

