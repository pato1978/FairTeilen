using System.Text;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Helpers;

public static class MailTemplates
{
    public static string BuildSnapshotMail(string groupId, int year, int month, SnapshotData data)
    {
        var sb = new StringBuilder();

        sb.AppendLine("<h2>📦 Monatssnapshot gespeichert</h2>");
        sb.AppendLine($"<p>Gruppe: <strong>{groupId}</strong><br>");
        sb.AppendLine($"Monat: <strong>{year}-{month:D2}</strong><br>");
        sb.AppendLine($"Erstellt am: <strong>{DateTime.Now:dd.MM.yyyy HH:mm}</strong></p>");

        sb.AppendLine("<h3>💰 Gesamtausgaben</h3>");
        sb.AppendLine("<ul>");
        sb.AppendLine($"<li><strong>Gesamt:</strong> {data.TotalExpenses:C}</li>");
        sb.AppendLine($"<li><strong>Davon Shared:</strong> {data.SharedExpenses:C}</li>");
        sb.AppendLine($"<li><strong>Davon Child:</strong> {data.ChildExpenses:C}</li>");
        sb.AppendLine("</ul>");

        sb.AppendLine("<h3>📊 Ausgaben nach Nutzer</h3>");
        sb.AppendLine("<ul>");
        foreach (var kv in data.ExpensesByUser)
            sb.AppendLine($"<li>{kv.Key}: {kv.Value:C}</li>");
        sb.AppendLine("</ul>");

        sb.AppendLine("<h3>⚖️ Salden</h3>");
        sb.AppendLine("<ul>");
        foreach (var kv in data.BalanceByUser)
        {
            var emoji = kv.Value switch
            {
                > 0 => "🟢 bekommt",
                < 0 => "🔴 schuldet",
                _   => "⚪️ ausgeglichen"
            };
            sb.AppendLine($"<li>{kv.Key}: {emoji} {Math.Abs(kv.Value):C}</li>");
        }
        sb.AppendLine("</ul>");

        sb.AppendLine("<hr><p style='font-size: 12px; color: gray;'>Share2Gether – Automatische Benachrichtigung</p>");

        return sb.ToString();
    }
}