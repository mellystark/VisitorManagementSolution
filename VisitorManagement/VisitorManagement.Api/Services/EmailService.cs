using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace VisitorManagement.Api.Services
{
    public class EmailSettings
    {
        public string SmtpServer { get; set; }
        public int Port { get; set; }
        public string SenderName { get; set; }
        public string SenderEmail { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendEmailWithQrAsync(string to, string subject, string body, byte[] qrCodeBytes);


    }

    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;

        public EmailService(IOptions<EmailSettings> settings)
        {
            _settings = settings.Value;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            using (var client = new SmtpClient(_settings.SmtpServer, _settings.Port))
            {
                client.Credentials = new NetworkCredential(_settings.Username, _settings.Password);
                client.EnableSsl = true;

                var mail = new MailMessage
                {
                    From = new MailAddress(_settings.SenderEmail, _settings.SenderName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mail.To.Add(to);

                await client.SendMailAsync(mail);
            }
        }

        public async Task SendEmailWithQrAsync(string to, string subject, string body, byte[] qrCodeBytes)
        {
            using (var client = new SmtpClient(_settings.SmtpServer, _settings.Port))
            {
                client.Credentials = new NetworkCredential(_settings.Username, _settings.Password);
                client.EnableSsl = true;

                var mail = new MailMessage
                {
                    From = new MailAddress(_settings.SenderEmail, _settings.SenderName),
                    Subject = subject,
                    IsBodyHtml = true
                };
                mail.To.Add(to);

                // QR kodunu inline resim olarak ekle
                var htmlBody =
                    $@"<html>
                <body>
                    <p>{body}</p>
                    <p><b>Sizin QR Kodunuz:</b></p>
                    <img src=""cid:qrcode"" />
                </body>
              </html>";

                var htmlView = AlternateView.CreateAlternateViewFromString(htmlBody, null, "text/html");

                // LinkedResource ile QR kodunu embed et
                var qrStream = new MemoryStream(qrCodeBytes);
                var qrImage = new LinkedResource(qrStream, "image/png")
                {
                    ContentId = "qrcode",
                    TransferEncoding = System.Net.Mime.TransferEncoding.Base64
                };

                htmlView.LinkedResources.Add(qrImage);
                mail.AlternateViews.Add(htmlView);

                await client.SendMailAsync(mail);
            }
        }

    }
}