using System;
using System.ComponentModel.DataAnnotations;

namespace VisitorManagement.Api.Entities
{
    public enum InviteStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2,
        Expired = 3
    }

    public class InviteRequest
    {
        public int Id { get; set; }

        [Required]
        public int InvitationId { get; set; }
        public Invitation Invitation { get; set; } = null!;

        [Required, MaxLength(200)]
        public string FullName { get; set; } = default!;

        [MaxLength(200)]
        public string? Email { get; set; }

        [MaxLength(50)]
        public string? PhoneNumber { get; set; }

        public string? Notes { get; set; }

        public InviteStatus Status { get; set; } = InviteStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DecidedAt { get; set; }
        public string? DecidedByUserId { get; set; } // ApplicationUser(Id)
        public ApplicationUser? DecidedByUser { get; set; }

        // Onaylandığında hangi Visitor’a dönüştürüldü
        public int? VisitorId { get; set; }
        public Visitor? Visitor { get; set; }
        public string? RejectionReason { get; set; }
    }
}
