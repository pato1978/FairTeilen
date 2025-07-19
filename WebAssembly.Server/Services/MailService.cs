
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace WebAssembly.Server.Services;

public class MailService : IMailService
{
    private readonly IConfiguration _cfg;

    public MailService(IConfiguration cfg)
    {
        _cfg = cfg;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody)
    {
        var mailConfig = _cfg.GetSection("MailSettings");
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(mailConfig["Sender"]));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(
            mailConfig["Host"],
            int.Parse(mailConfig["Port"]!),
            SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(
            mailConfig["User"],
            mailConfig["Pass"]);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}