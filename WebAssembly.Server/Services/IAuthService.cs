using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest req);
    Task<AuthResponse> LoginAsync(LoginRequest req);
    UserDto ToUserDto(AppUser u);
}

