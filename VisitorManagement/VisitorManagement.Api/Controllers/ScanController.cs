using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using VisitorManagement.Api.Data;
using VisitorManagement.Api.DTOs;
using VisitorManagement.Api.Entities;
using Microsoft.AspNetCore.SignalR;
using VisitorManagement.Api.Hubs;

namespace VisitorManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ScanController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public ScanController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpPost]
        public async Task<IActionResult> ScanQrCode([FromBody] ScanRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.QrData))
                return BadRequest(new ScanResponse
                {
                    Success = false,
                    Message = "QR kod verisi boş olamaz."
                });

            var visitor = await _context.Visitors
                .FirstOrDefaultAsync(v => v.QrCodeData == request.QrData);

            if (visitor == null)
                return NotFound(new ScanResponse
                {
                    Success = false,
                    Message = "Davetli değil."
                });

            var activeLog = await _context.VisitorLogs
                .FirstOrDefaultAsync(l => l.VisitorId == visitor.Id && l.ExitTime == null);

            if (activeLog == null)
            {
                var newLog = new VisitorLog
                {
                    VisitorId = visitor.Id,
                    EntryTime = DateTime.UtcNow,
                    Source = "mobile",
                    Metadata = Request.Headers["User-Agent"].ToString()
                };

                _context.VisitorLogs.Add(newLog);
                await _context.SaveChangesAsync();

                await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
                {
                    Type = "EntryCreated",
                    Message = "Yeni giriş yapıldı",
                    LogId = newLog.Id
                });

                return Ok(new ScanResponse
                {
                    Success = true,
                    Message = "Giriş Yapıldı.",
                    Visitor = new VisitorDto
                    {
                        Id = visitor.Id,
                        FullName = visitor.FullName,
                        Email = visitor.Email,
                        PhoneNumber = visitor.PhoneNumber,
                        QrCodeData = visitor.QrCodeData,
                        CreatedAt = visitor.CreatedAt
                    },
                    LogId = newLog.Id,
                    EntryTime = newLog.EntryTime
                });
            }
            else
            {
                activeLog.ExitTime = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
                {
                    Type = "ExitUpdate",
                    Message = $"{visitor.FullName} adlı ziyaretçi çıkış yaptı.",
                    LogId = activeLog.Id,
                    ExitTime = activeLog.ExitTime
                });

                return Ok(new ScanResponse
                {
                    Success = true,
                    Message = "Çıkış Yapıldı.",
                    Visitor = new VisitorDto
                    {
                        Id = visitor.Id,
                        FullName = visitor.FullName,
                        Email = visitor.Email,
                        PhoneNumber = visitor.PhoneNumber,
                        QrCodeData = visitor.QrCodeData,
                        CreatedAt = visitor.CreatedAt
                    },
                    LogId = activeLog.Id,
                    EntryTime = activeLog.EntryTime,
                    ExitTime = activeLog.ExitTime
                });
            }
        }


    }
}
