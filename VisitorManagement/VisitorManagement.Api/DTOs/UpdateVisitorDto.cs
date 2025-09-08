namespace VisitorManagement.Api.DTOs
{
    public class UpdateVisitorDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = null!;
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Notes { get; set; }
    }

}
