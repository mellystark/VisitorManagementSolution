using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using QRCoder;
using System.Text;
using VisitorManagement.Api.Data;
using VisitorManagement.Api.DTOs;
using VisitorManagement.Api.Entities;
using VisitorManagement.Api.Hubs;
using VisitorManagement.Api.Services;


namespace VisitorManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]  // Admin yetkisi gerektirir, istersen kaldırabilirsin
    public class VisitorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<VisitorHub> _hubContext;    // mevcut visitor hub
        private readonly IHubContext<StatsHub> _statsHubContext; // yeni stats hub
        private readonly IEmailService _emailService;

        public VisitorController(
            ApplicationDbContext context,
            IHubContext<VisitorHub> hubContext,
            IHubContext<StatsHub> statsHubContext,
            IEmailService emailService)
        {
            _context = context;
            _hubContext = hubContext;
            _statsHubContext = statsHubContext;
            _emailService = emailService;
        }


        [HttpGet]
        public async Task<IActionResult> GetAllVisitors()
        {
            var visitors = await _context.Visitors
                .Select(v => new VisitorDto
                {
                    Id = v.Id,
                    FullName = v.FullName,
                    Email = v.Email,
                    PhoneNumber = v.PhoneNumber,
                    QrCodeData = v.QrCodeData,
                    CreatedAt = v.CreatedAt
                })
                .ToListAsync();

            return Ok(visitors);
        }

        // POST: api/Visitor
        [HttpPost]
        public async Task<IActionResult> CreateVisitor([FromBody] CreateVisitorDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Yeni GUID oluştur (QrCodeData)
            string qrCodeData = Guid.NewGuid().ToString();

            var visitor = new Visitor
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                QrCodeData = qrCodeData,
                CreatedAt = DateTime.UtcNow
            };

            _context.Visitors.Add(visitor);
            await _context.SaveChangesAsync();

            var visitorDto = new VisitorDto
            {
                Id = visitor.Id,
                FullName = visitor.FullName,
                Email = visitor.Email,
                PhoneNumber = visitor.PhoneNumber,
                QrCodeData = visitor.QrCodeData,
                CreatedAt = visitor.CreatedAt
            };

            //signalr
            await _hubContext.Clients.All.SendAsync("VisitorAdded", visitorDto);
            // **Yeni:** istatistikleri hesapla ve gönder
            await BroadcastStatsAsync();

            return CreatedAtAction(nameof(GetVisitorById), new { id = visitor.Id }, visitorDto);
        }

        // GET: api/Visitor/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetVisitorById(int id)
        {
            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
                return NotFound();

            var visitorDto = new VisitorDto
            {
                Id = visitor.Id,
                FullName = visitor.FullName,
                Email = visitor.Email,
                PhoneNumber = visitor.PhoneNumber,
                QrCodeData = visitor.QrCodeData,
                CreatedAt = visitor.CreatedAt
            };

            return Ok(visitorDto);
        }

        // GET: api/Visitor/{id}/qrcode
        [HttpGet("{id}/qrcode")]
        public async Task<IActionResult> GetVisitorQrCode(int id)
        {
            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
                return NotFound();

            using QRCodeGenerator qrGenerator = new QRCodeGenerator();
            using QRCodeData qrCodeData = qrGenerator.CreateQrCode(visitor.QrCodeData, QRCodeGenerator.ECCLevel.Q);
            using PngByteQRCode qrCode = new PngByteQRCode(qrCodeData);

            byte[] qrCodeImage = qrCode.GetGraphic(20);

            return File(qrCodeImage, "image/png");
        }

        [HttpPost("{id}/send-qrcode-email")]
        public async Task<IActionResult> SendQrCodeEmail(int id)
        {
            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
                return NotFound("Visitor bulunamadı.");

            if (string.IsNullOrEmpty(visitor.Email))
                return BadRequest("Visitor için e-posta adresi yok.");

            // QR kodu üret
            using QRCodeGenerator qrGenerator = new QRCodeGenerator();
            using QRCodeData qrCodeData = qrGenerator.CreateQrCode(visitor.QrCodeData, QRCodeGenerator.ECCLevel.Q);
            using PngByteQRCode qrCode = new PngByteQRCode(qrCodeData);

            byte[] qrCodeImage = qrCode.GetGraphic(20);

            // Mail gönder
            string subject = "Visitor QR Kodunuz";
            string body = $"Merhaba {visitor.FullName},<br/>" +
                          $"Aşağıda giriş için kullanabileceğiniz QR kodunuz bulunmaktadır.";

            await _emailService.SendEmailWithQrAsync(visitor.Email, subject, body, qrCodeImage);

            return Ok(new { message = "QR kod e-posta ile gönderildi." });
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVisitor(int id)
        {
            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
                return NotFound();

            _context.Visitors.Remove(visitor);
            await _context.SaveChangesAsync();

            //signalr
            await _hubContext.Clients.All.SendAsync("VisitorDeleted", id);
            // **Yeni:** istatistikleri hesapla ve gönder
            await BroadcastStatsAsync();

            return NoContent();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVisitor(int id, [FromBody] UpdateVisitorDto dto)
        {
            if (id != dto.Id)
                return BadRequest();

            var visitor = await _context.Visitors.FindAsync(id);
            if (visitor == null)
                return NotFound();

            visitor.FullName = dto.FullName;
            visitor.Email = dto.Email;
            visitor.PhoneNumber = dto.PhoneNumber;
            visitor.Notes = dto.Notes;

            await _context.SaveChangesAsync();

            //signalr
            await _hubContext.Clients.All.SendAsync("VisitorUpdated", dto);
            // **Yeni:** istatistikleri hesapla ve gönder
            await BroadcastStatsAsync();

            return NoContent();
        }

        private async Task BroadcastStatsAsync()
        {
            try
            {
                var totalVisitors = await _context.Visitors.CountAsync();
                var today = DateTime.UtcNow.Date;
                var dailyEntries = await _context.VisitorLogs.CountAsync(l => l.EntryTime >= today);
                var dailyExits = await _context.VisitorLogs.CountAsync(l => l.ExitTime != null && l.ExitTime >= today);

                var statsPayload = new
                {
                    TotalVisitors = totalVisitors,
                    DailyEntries = dailyEntries,
                    DailyExits = dailyExits,
                    Timestamp = DateTime.UtcNow
                };

                // StatsHub'a gönder
                await _statsHubContext.Clients.All.SendAsync("ReceiveStatsUpdate", statsPayload);
            }
            catch (Exception ex)
            {
                // Hata logla ama isteği bozma
                Console.WriteLine("BroadcastStatsAsync hata: " + ex);
            }
        }

        [HttpGet("filter")]
        public async Task<IActionResult> GetFilteredVisitors(
          [FromQuery] string? fullName,
          [FromQuery] string? phoneNumber,
          [FromQuery] DateTime? startDate,
          [FromQuery] DateTime? endDate,
          [FromQuery] bool? onlyNotExited,
          [FromQuery] int page = 1,
          [FromQuery] int pageSize = 10)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 10;

            var query = _context.Visitors.AsQueryable();

            // İsim filtresi (büyük/küçük harf duyarsız)
            if (!string.IsNullOrWhiteSpace(fullName))
            {
                var lowerName = fullName.ToLower();
                query = query.Where(v => v.FullName.ToLower().Contains(lowerName));
            }

            // Telefon filtresi
            if (!string.IsNullOrWhiteSpace(phoneNumber))
            {
                var lowerPhone = phoneNumber.ToLower();
                query = query.Where(v => v.PhoneNumber != null &&
                                         v.PhoneNumber.ToLower().Contains(lowerPhone));
            }

            // Tarih aralığı filtresi
            if (startDate.HasValue || endDate.HasValue)
            {
                query = query.Where(v =>
                    _context.VisitorLogs.Any(l =>
                        l.Visitor.Id == v.Id &&
                        (!startDate.HasValue || l.EntryTime >= startDate.Value) &&
                        (!endDate.HasValue || l.EntryTime <= endDate.Value)
                    )
                );
            }

            // Çıkış yapmayanlar filtresi
            if (onlyNotExited == true)
            {
                query = query.Where(v =>
                    _context.VisitorLogs.Any(l =>
                        l.Visitor.Id == v.Id &&
                        l.ExitTime == null
                    )
                );
            }

            var totalCount = await query.CountAsync();

            var visitors = await query
                .OrderBy(v => v.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(v => new VisitorDto
                {
                    Id = v.Id,
                    FullName = v.FullName,
                    Email = v.Email,
                    PhoneNumber = v.PhoneNumber,
                    QrCodeData = v.QrCodeData,
                    CreatedAt = v.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                Data = visitors
            });
        }

        [HttpGet("export-excel")]
        public async Task<IActionResult> ExportVisitorsToExcel()
        {
            var visitors = await _context.Visitors
                .Select(v => new
                {
                    v.Id,
                    v.FullName,
                    v.Email,
                    v.PhoneNumber,
                    v.CreatedAt
                })
                .ToListAsync();

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Visitors");

            // Başlıklar
            worksheet.Cells[1, 1].Value = "ID";
            worksheet.Cells[1, 2].Value = "Full Name";
            worksheet.Cells[1, 3].Value = "Email";
            worksheet.Cells[1, 4].Value = "Phone Number";
            worksheet.Cells[1, 5].Value = "Created At";

            // Veriler
            for (int i = 0; i < visitors.Count; i++)
            {
                var v = visitors[i];
                worksheet.Cells[i + 2, 1].Value = v.Id;
                worksheet.Cells[i + 2, 2].Value = v.FullName;
                worksheet.Cells[i + 2, 3].Value = v.Email;
                worksheet.Cells[i + 2, 4].Value = v.PhoneNumber;
                worksheet.Cells[i + 2, 5].Value = v.CreatedAt.ToString("yyyy-MM-dd HH:mm");
            }

            worksheet.Cells.AutoFitColumns();

            var fileBytes = package.GetAsByteArray();
            return File(fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Visitors_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }

        [HttpGet("export-csv")]
        public async Task<IActionResult> ExportVisitorsToCsv()
        {
            var visitors = await _context.Visitors
                .Select(v => new
                {
                    v.Id,
                    v.FullName,
                    v.Email,
                    v.PhoneNumber,
                    v.CreatedAt
                })
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("ID;Full Name;Email;Phone Number;Created At");

            foreach (var v in visitors)
            {
                csv.AppendLine(
                    $"{v.Id};" +
                    $"{EscapeForCsv(v.FullName)};" +
                    $"{EscapeForCsv(v.Email)};" +
                    $"{ForceQuote(v.PhoneNumber)};" +
                    $"{ForceQuote(v.CreatedAt.ToString("yyyy-MM-dd HH:mm"))}"
                );
            }

            // UTF8 BOM ekle
            var preamble = Encoding.UTF8.GetPreamble();
            var bytesWithoutBom = Encoding.UTF8.GetBytes(csv.ToString());
            var bytes = new byte[preamble.Length + bytesWithoutBom.Length];
            Buffer.BlockCopy(preamble, 0, bytes, 0, preamble.Length);
            Buffer.BlockCopy(bytesWithoutBom, 0, bytes, preamble.Length, bytesWithoutBom.Length);

            return File(bytes, "text/csv", $"Visitors_{DateTime.Now:yyyyMMdd_HHmm}.csv");
        }

        private string EscapeForCsv(string field)
        {
            if (string.IsNullOrEmpty(field))
                return "";

            bool mustQuote = field.Contains(";") || field.Contains("\"") || field.Contains("\n") || field.Contains("\r");

            var escaped = field.Replace("\"", "\"\"");

            return mustQuote ? $"\"{escaped}\"" : escaped;
        }

        // Özellikle telefon ve tarih gibi alanları daima tırnak içine alır
        private string ForceQuote(string field)
        {
            if (field == null) return "";
            var escaped = field.Replace("\"", "\"\"");
            return $"\"{escaped}\"";
        }

    }
}
