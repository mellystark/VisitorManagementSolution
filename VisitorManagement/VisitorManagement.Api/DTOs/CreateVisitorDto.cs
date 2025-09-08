using System.ComponentModel.DataAnnotations;

namespace VisitorManagement.Api.DTOs
{
    public class CreateVisitorDto
    {
        [Required]
        public string FullName { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        public string? PhoneNumber { get; set; }
    }
}
