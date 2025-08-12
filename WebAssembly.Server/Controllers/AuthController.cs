using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using WebAssembly.Server.Models;
using WebAssembly.Server.Services;

namespace WebAssembly.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;
        private readonly ILogger<AuthController> _log;

        public AuthController(IAuthService auth, ILogger<AuthController> log)
        {
            _auth = auth;
            _log = log;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req)
        {
            try
            {
                var res = await _auth.RegisterAsync(req);
                return Ok(res);
            }
            catch (InvalidOperationException ex)
            {
                _log.LogWarning(ex, "Register failed");
                return Conflict(new { error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
        {
            try
            {
                var res = await _auth.LoginAsync(req);
                return Ok(res);
            }
            catch (UnauthorizedAccessException ex)
            {
                _log.LogWarning(ex, "Login failed");
                return Unauthorized(new { error = "Invalid credentials" });
            }
        }
    }
}

