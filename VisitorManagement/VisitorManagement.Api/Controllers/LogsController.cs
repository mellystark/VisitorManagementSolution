using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VisitorManagement.Api.Data;
using OfficeOpenXml;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using VisitorManagement.Api.Hubs;



namespace VisitorManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public LogsController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Belirtilen ziyaretçi ID'sine ait tüm logları getirir.
        /// </summary>
        /// <param name="visitorId">Ziyaretçi ID</param>
        /// 

        [HttpGet("all")]
        public async Task<IActionResult> GetAllLogs(
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate,
    [FromQuery] string? visitorName,
    [FromQuery] string? phoneNumber,
    [FromQuery] bool onlyNotExited = false,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 20;

            var query = _context.VisitorLogs
                .Include(v => v.Visitor)
                .AsQueryable();

            // Filtreler
            if (startDate.HasValue)
                query = query.Where(l => l.EntryTime >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(l => l.EntryTime <= endDate.Value);

            if (!string.IsNullOrWhiteSpace(visitorName))
                query = query.Where(l => l.Visitor.FullName.Contains(visitorName));

            if (!string.IsNullOrWhiteSpace(phoneNumber))
                query = query.Where(l => l.Visitor.PhoneNumber.Contains(phoneNumber));

            if (onlyNotExited)
                query = query.Where(l => l.ExitTime == null);

            var totalCount = await query.CountAsync();

            var logs = await query
                .OrderByDescending(l => l.EntryTime) // en son eklenen en üstte
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new
                {
                    l.Id,
                    VisitorName = l.Visitor.FullName,
                    l.EntryTime,
                    l.ExitTime,
                    PhoneNumber = l.Visitor.PhoneNumber
                })
                .ToListAsync();

            return Ok(new
            {
                totalCount,
                page,
                pageSize,
                data = logs
            });
        }


        [HttpGet]
        public async Task<IActionResult> GetLogs(
        [FromQuery] int visitorId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
        {
            if (visitorId <= 0)
                return BadRequest("visitorId parametresi zorunludur ve pozitif olmalıdır.");

            var query = _context.VisitorLogs
                .Include(v => v.Visitor)
                .Where(l => l.Visitor.Id == visitorId);

            if (startDate.HasValue)
                query = query.Where(l => l.EntryTime >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(l => l.EntryTime <= endDate.Value);

            var logs = await query
                .OrderByDescending(l => l.EntryTime)
                .Select(l => new
                {
                    l.Id,
                    VisitorName = l.Visitor.FullName,
                    l.EntryTime,
                    l.ExitTime,
           
                })
                .ToListAsync();

            if (!logs.Any())
                return NotFound("Bu ziyaretçiye ait log bulunamadı.");

            return Ok(logs);
        }

        [HttpPut("{id}/exit")]
        public async Task<IActionResult> AddExitTime(int id)
        {
            var log = await _context.VisitorLogs.FindAsync(id);
            if (log == null) return NotFound("Log kaydı bulunamadı.");

            if (log.ExitTime != null)
                return BadRequest("Çıkış zamanı zaten kayıtlı.");

            log.ExitTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Bildirim gönder
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
            {
                Type = "ExitUpdate",
                Message = $"{log.Id} numaralı ziyaretçinin çıkışı kaydedildi.",
                ExitTime = log.ExitTime
            });

            return Ok(new { message = "Çıkış zamanı başarıyla eklendi.", ExitTime = log.ExitTime });
        }


        [HttpGet("export-excel")]
        public async Task<IActionResult> ExportLogsToExcel(
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate,
    [FromQuery] string? visitorName,
    [FromQuery] string? phoneNumber,
    [FromQuery] bool onlyNotExited = false)
        {
            var query = _context.VisitorLogs
                .Include(v => v.Visitor)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(l => l.EntryTime >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(l => l.EntryTime <= endDate.Value);

            if (!string.IsNullOrWhiteSpace(visitorName))
                query = query.Where(l => l.Visitor.FullName.Contains(visitorName));

            if (!string.IsNullOrWhiteSpace(phoneNumber))
                query = query.Where(l => l.Visitor.PhoneNumber.Contains(phoneNumber));

            if (onlyNotExited)
                query = query.Where(l => l.ExitTime == null);

            var logs = await query
                .OrderByDescending(l => l.EntryTime)
                .Select(l => new
                {
                    l.Id,
                    VisitorName = l.Visitor.FullName,
                    l.Visitor.PhoneNumber,
                    l.EntryTime,
                    l.ExitTime
                })
                .ToListAsync();

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Visitor Logs");

            // Başlıklar
            worksheet.Cells[1, 1].Value = "Log ID";
            worksheet.Cells[1, 2].Value = "Visitor Name";
            worksheet.Cells[1, 3].Value = "Phone Number";
            worksheet.Cells[1, 4].Value = "Entry Time";
            worksheet.Cells[1, 5].Value = "Exit Time";

            // Veriler
            for (int i = 0; i < logs.Count; i++)
            {
                var log = logs[i];
                worksheet.Cells[i + 2, 1].Value = log.Id;
                worksheet.Cells[i + 2, 2].Value = log.VisitorName;

                // Telefonu metin olarak sakla
                worksheet.Cells[i + 2, 3].Style.Numberformat.Format = "@";
                worksheet.Cells[i + 2, 3].Value = log.PhoneNumber;

                // Tarihi de metin olarak sakla
                worksheet.Cells[i + 2, 4].Style.Numberformat.Format = "@";
                worksheet.Cells[i + 2, 4].Value = log.EntryTime.ToString("yyyy-MM-dd HH:mm");

                worksheet.Cells[i + 2, 5].Style.Numberformat.Format = "@";
                worksheet.Cells[i + 2, 5].Value = log.ExitTime?.ToString("yyyy-MM-dd HH:mm") ?? "";
            }

            worksheet.Cells.AutoFitColumns();

            var fileBytes = package.GetAsByteArray();
            return File(fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"VisitorLogs_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }

        [HttpGet("export-csv")]
        public async Task<IActionResult> ExportLogsToCsv(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? visitorName,
            [FromQuery] string? phoneNumber,
            [FromQuery] bool onlyNotExited = false)
        {
            var query = _context.VisitorLogs
                .Include(v => v.Visitor)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(l => l.EntryTime >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(l => l.EntryTime <= endDate.Value);

            if (!string.IsNullOrWhiteSpace(visitorName))
                query = query.Where(l => l.Visitor.FullName.Contains(visitorName));

            if (!string.IsNullOrWhiteSpace(phoneNumber))
                query = query.Where(l => l.Visitor.PhoneNumber.Contains(phoneNumber));

            if (onlyNotExited)
                query = query.Where(l => l.ExitTime == null);

            var logs = await query
                .OrderByDescending(l => l.EntryTime)
                .Select(l => new
                {
                    l.Id,
                    VisitorName = l.Visitor.FullName,
                    l.Visitor.PhoneNumber,
                    l.EntryTime,
                    l.ExitTime
                })
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("Log ID;Visitor Name;Phone Number;Entry Time;Exit Time");

            foreach (var log in logs)
            {
                csv.AppendLine(
                    $"{log.Id};" +
                    $"{EscapeForCsv(log.VisitorName)};" +
                    $"{ForceQuote(log.PhoneNumber)};" +
                    $"{ForceQuote(log.EntryTime.ToString("yyyy-MM-dd HH:mm"))};" +
                    $"{ForceQuote(log.ExitTime?.ToString("yyyy-MM-dd HH:mm") ?? "")}"
                );
            }

            // UTF8 BOM ekle
            var preamble = Encoding.UTF8.GetPreamble();
            var bytesWithoutBom = Encoding.UTF8.GetBytes(csv.ToString());
            var bytes = new byte[preamble.Length + bytesWithoutBom.Length];
            Buffer.BlockCopy(preamble, 0, bytes, 0, preamble.Length);
            Buffer.BlockCopy(bytesWithoutBom, 0, bytes, preamble.Length, bytesWithoutBom.Length);

            return File(bytes, "text/csv", $"VisitorLogs_{DateTime.Now:yyyyMMdd_HHmm}.csv");
        }

        private string EscapeForCsv(string field)
        {
            if (string.IsNullOrEmpty(field))
                return "";

            bool mustQuote = field.Contains(";") || field.Contains("\"") || field.Contains("\n") || field.Contains("\r");

            var escaped = field.Replace("\"", "\"\"");

            return mustQuote ? $"\"{escaped}\"" : escaped;
        }

        private string ForceQuote(string field)
        {
            if (field == null) return "";
            var escaped = field.Replace("\"", "\"\"");
            return $"\"{escaped}\"";
        }


    }
}
