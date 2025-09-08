using System.ComponentModel.DataAnnotations;

namespace VisitorManagement.Api.Entities
{
    public class Invitation
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = default!;

        public DateTime EventDate { get; set; }

        // Davet linkinde kullanılacak kısa kod
        [Required, MaxLength(32)]
        public string Slug { get; set; } = default!;

        public bool IsActive { get; set; } = true;

        public string? Description { get; set; }

        // Opsiyonel: kim oluşturdu
        public string? CreatedByUserId { get; set; }
        public ApplicationUser? CreatedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<InviteRequest> InviteRequests { get; set; } = new List<InviteRequest>();
        public ICollection<Visitor> Visitors { get; set; } = new List<Visitor>();
    }
}
