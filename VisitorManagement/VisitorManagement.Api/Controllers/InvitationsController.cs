using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using VisitorManagement.Api.Data;
using VisitorManagement.Api.DTOs;
using VisitorManagement.Api.Entities;

namespace VisitorManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvitationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public InvitationsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // =============== DAVET CRUD (Admin) ===============

        // POST: api/invitations
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateInvitation([FromBody] CreateInvitationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var entity = new Invitation
            {
                Name = dto.Name,
                EventDate = dto.EventDate,
                Slug = dto.Slug,
                Description = dto.Description,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = (await _userManager.GetUserAsync(User))?.Id
            };

            _context.Invitations.Add(entity);
            await _context.SaveChangesAsync();

            var result = new InvitationDto
            {
                Id = entity.Id,
                Name = entity.Name,
                EventDate = entity.EventDate,
                Slug = entity.Slug,
                Description = entity.Description,
                IsActive = entity.IsActive,
                CreatedByUserId = entity.CreatedByUserId,
                CreatedAt = entity.CreatedAt
            };

            return Ok(result);
        }

        // GET: api/invitations
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll([FromQuery] bool onlyActive = false)
        {
            var query = _context.Invitations.AsQueryable();
            if (onlyActive) query = query.Where(i => i.IsActive);

            var list = await query
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new InvitationDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    EventDate = i.EventDate,
                    Slug = i.Slug,
                    Description = i.Description,
                    IsActive = i.IsActive,
                    CreatedByUserId = i.CreatedByUserId,
                    CreatedAt = i.CreatedAt
                })
                .ToListAsync();

            return Ok(list);
        }

        // GET: api/invitations/{invitationId}/visitors
        [HttpGet("{invitationId}/visitors")]
        public async Task<IActionResult> GetVisitorsByInvitation(int invitationId)
        {
            var visitors = await _context.Visitors
                .Where(v => v.InvitationId == invitationId)
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

        // GET: api/invitations/{slug}
        [HttpGet("{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var invitation = await _context.Invitations
                .FirstOrDefaultAsync(i => i.Slug == slug && i.IsActive);

            if (invitation == null) return NotFound();

            var dto = new InvitationDto
            {
                Id = invitation.Id,
                Name = invitation.Name,
                EventDate = invitation.EventDate,
                Slug = invitation.Slug,
                Description = invitation.Description,
                IsActive = invitation.IsActive,
                CreatedByUserId = invitation.CreatedByUserId,
                CreatedAt = invitation.CreatedAt
            };

            return Ok(dto);
        }

        // PUT: api/invitations/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateInvitation(int id, [FromBody] CreateInvitationDto dto)
        {
            var invitation = await _context.Invitations.FindAsync(id);
            if (invitation == null) return NotFound();

            invitation.Name = dto.Name;
            invitation.Description = dto.Description;
            invitation.EventDate = dto.EventDate;
            invitation.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            var result = new InvitationDto
            {
                Id = invitation.Id,
                Name = invitation.Name,
                EventDate = invitation.EventDate,
                Slug = invitation.Slug,
                Description = invitation.Description,
                IsActive = invitation.IsActive,
                CreatedByUserId = invitation.CreatedByUserId,
                CreatedAt = invitation.CreatedAt
            };

            return Ok(result);
        }

        // DELETE: api/invitations/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteInvitation(int id)
        {
            var invitation = await _context.Invitations.FindAsync(id);
            if (invitation == null) return NotFound();

            _context.Invitations.Remove(invitation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Davet silindi." });
        }

        // GET: api/invitations/{id}/requests?status=pending
        [HttpGet("{id}/requests")]
        [Authorize]
        public async Task<IActionResult> GetRequests(int id, [FromQuery] string? status = null)
        {
            var query = _context.InviteRequests.Where(r => r.InvitationId == id);

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<InviteStatus>(status, true, out var parsed))
                query = query.Where(r => r.Status == parsed);

            var list = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.FullName,
                    r.Email,
                    r.PhoneNumber,
                    r.Status,
                    r.CreatedAt,
                    r.DecidedAt,
                    r.RejectionReason
                })
                .ToListAsync();

            return Ok(list);
        }

        // POST: api/invitations/requests/{requestId}/approve
        [HttpPost("requests/{requestId}/approve")]
        [Authorize]
        public async Task<IActionResult> ApproveRequest(int requestId)
        {
            var invite = await _context.InviteRequests
                .FirstOrDefaultAsync(i => i.Id == requestId);

            if (invite == null) return NotFound("Başvuru bulunamadı.");
            if (invite.Status != InviteStatus.Pending) return BadRequest("Bu başvuru beklemede değil.");

            var visitor = new Visitor
            {
                FullName = invite.FullName,
                Email = invite.Email,
                PhoneNumber = invite.PhoneNumber,
                QrCodeData = Guid.NewGuid().ToString(),
                CreatedAt = DateTime.UtcNow,
                InvitationId = invite.InvitationId
            };

            _context.Visitors.Add(visitor);
            await _context.SaveChangesAsync();

            var admin = await _userManager.GetUserAsync(User);
            invite.Status = InviteStatus.Approved;
            invite.DecidedAt = DateTime.UtcNow;
            invite.DecidedByUserId = admin?.Id;
            invite.VisitorId = visitor.Id;

            await _context.SaveChangesAsync();

            var dto = new VisitorDto
            {
                Id = visitor.Id,
                FullName = visitor.FullName,
                Email = visitor.Email,
                PhoneNumber = visitor.PhoneNumber,
                QrCodeData = visitor.QrCodeData,
                CreatedAt = visitor.CreatedAt
            };

            // ✅ ardından request kaydını tamamen sil
            _context.InviteRequests.Remove(invite);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Başvuru onaylandı.", visitor = dto });
        }

        // POST: api/invitations/requests/{requestId}/reject
        [HttpPost("requests/{requestId}/reject")]
        [Authorize]
        public async Task<IActionResult> RejectRequest(int requestId, [FromBody] RejectInviteDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var invite = await _context.InviteRequests.FirstOrDefaultAsync(i => i.Id == requestId);
            if (invite == null) return NotFound();
            if (invite.Status != InviteStatus.Pending) return BadRequest("Bu başvuru beklemede değil.");

            var admin = await _userManager.GetUserAsync(User);
            invite.Status = InviteStatus.Rejected;
            invite.DecidedAt = DateTime.UtcNow;
            invite.DecidedByUserId = admin?.Id;
            invite.RejectionReason = dto.Reason;

            _context.InviteRequests.Remove(invite);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Başvuru reddedildi." });
        }

        // POST: api/invitations/{slug}/request
        [HttpPost("{slug}/request")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateRequest(string slug, [FromBody] CreateInviteRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var invitation = await _context.Invitations
                .FirstOrDefaultAsync(i => i.Slug == slug && i.IsActive);

            if (invitation == null)
                return NotFound(new { message = "Geçerli bir davet bulunamadı." });

            var alreadyPending = await _context.InviteRequests
                .AnyAsync(r => r.InvitationId == invitation.Id
                            && r.Email == dto.Email
                            && r.Status == InviteStatus.Pending);

            if (alreadyPending)
                return BadRequest(new { message = "Bu e-posta için zaten beklemede bir başvuru var." });

            var entity = new InviteRequest
            {
                InvitationId = invitation.Id,
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Notes = dto.Notes,
                Status = InviteStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.InviteRequests.Add(entity);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Başvurunuz alınmıştır. Onaylandığında bilgilendirileceksiniz.",
                requestId = entity.Id
            });
        }

        // DELETE: api/invitations/{invitationId}/visitors/{visitorId}
        [HttpDelete("{invitationId}/visitors/{visitorId}")]
        [Authorize]
        public async Task<IActionResult> RemoveVisitor(int invitationId, int visitorId)
        {
            // Transaction: hem linkleri kopar, hem sil, hem de pending'e koy
            using var tx = await _context.Database.BeginTransactionAsync();

            try
            {
                var visitor = await _context.Visitors
                    .FirstOrDefaultAsync(v => v.Id == visitorId && v.InvitationId == invitationId);

                if (visitor == null)
                    return NotFound(new { message = "Ziyaretçi bulunamadı." });

                // 1) Bu visitor'a referanslı InviteRequest var mı? Varsa VisitorId alanını null yap
                var linkedRequests = await _context.InviteRequests
                    .Where(r => r.VisitorId == visitorId)
                    .ToListAsync();

                foreach (var r in linkedRequests)
                {
                    r.VisitorId = null;
                    // istersen status/log da değiştirmeyebilirsin, burada dokunmuyoruz.
                }
                await _context.SaveChangesAsync();

                // 2) Ziyaretçiyi sil
                _context.Visitors.Remove(visitor);
                await _context.SaveChangesAsync();

                // 3) Bekleyenlere geri al (aynı kişiden hâlihazırda Pending varsa tekrar ekleme)
                var existingPending = await _context.InviteRequests.FirstOrDefaultAsync(r =>
                    r.InvitationId == invitationId &&
                    r.Status == InviteStatus.Pending &&
                    (
                        (!string.IsNullOrEmpty(visitor.Email) && r.Email == visitor.Email)
                        ||
                        (!string.IsNullOrEmpty(visitor.PhoneNumber) && r.PhoneNumber == visitor.PhoneNumber)
                        ||
                        r.FullName == visitor.FullName // son çare, email/telefon yoksa
                    )
                );

                if (existingPending != null)
                {
                    // Zaten Pending varsa, sadece not ekleyip bırakabiliriz
                    existingPending.Notes = (existingPending.Notes ?? "")
                                            + " | Davetlilerden çıkarıldı ve beklemeye geri alındı.";
                    // Status zaten Pending
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Yeni pending request oluştur
                    var request = new InviteRequest
                    {
                        InvitationId = invitationId,
                        FullName = visitor.FullName,
                        Email = visitor.Email,
                        PhoneNumber = visitor.PhoneNumber,
                        Notes = "Daha önce onaylanmıştı, davetlilerden çıkarıldı.",
                        Status = InviteStatus.Pending,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.InviteRequests.Add(request);
                    await _context.SaveChangesAsync();
                }

                await tx.CommitAsync();

                return Ok(new { message = "Davetli silindi ve tekrar bekleyenler listesine alındı." });
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                Console.WriteLine("RemoveVisitor hata: " + ex);
                return StatusCode(500, new { message = "İşlem sırasında hata oluştu.", detail = ex.Message });
            }
        }
    }
}
