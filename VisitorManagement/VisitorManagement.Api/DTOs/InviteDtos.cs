using System;
using System.ComponentModel.DataAnnotations;

namespace VisitorManagement.Api.DTOs
{
    public class CreateInvitationDto
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = default!;

        [Required]
        public DateTime EventDate { get; set; }

        [Required, MaxLength(32)]
        public string Slug { get; set; } = default!;

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class InvitationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public DateTime EventDate { get; set; }
        public string Slug { get; set; } = default!;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public string? CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class RejectInviteDto
    {
        [Required, MaxLength(500)]
        public string Reason { get; set; } = default!;
    }

    public class CreateInviteRequestDto
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? Notes { get; set; }   // ✅ katılımcının ek notu
    }
}
