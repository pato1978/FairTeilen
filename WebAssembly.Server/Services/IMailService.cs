namespace WebAssembly.Server.Services;

public interface IMailService
{
    /// <summary>
    /// Sendet eine einfache HTML‑E‑Mail.
    /// </summary>
    Task SendEmailAsync(string to, string subject, string htmlBody);
}