using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VisitorManagement.Api.Entities;

namespace VisitorManagement.Api.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<Visitor> Visitors { get; set; }
        public DbSet<VisitorLog> VisitorLogs { get; set; }
        public DbSet<InviteRequest> InviteRequests { get; set; }
        public DbSet<Invitation> Invitations { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Unique constraint on QrCodeData
            builder.Entity<Visitor>()
                .HasIndex(v => v.QrCodeData)
                .IsUnique();

            // Visitor-VisitorLog relation
            builder.Entity<VisitorLog>()
                .HasOne(vl => vl.Visitor)
                .WithMany(v => v.VisitorLogs)
                .HasForeignKey(vl => vl.VisitorId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<InviteRequest>()
                .HasIndex(i => new { i.Email, i.Status });

            // Invitation.Slug benzersiz
            builder.Entity<Invitation>()
                .HasIndex(i => i.Slug)
                .IsUnique();

            // Invitation - InviteRequest (1 - N)
            builder.Entity<InviteRequest>()
                .HasOne(ir => ir.Invitation)
                .WithMany(i => i.InviteRequests)
                .HasForeignKey(ir => ir.InvitationId)
                .OnDelete(DeleteBehavior.Cascade);

            // InviteRequest - Visitor (1 - 0/1)
            builder.Entity<InviteRequest>()
                .HasOne(ir => ir.Visitor)
                .WithOne()
                .HasForeignKey<InviteRequest>(ir => ir.VisitorId)
                .OnDelete(DeleteBehavior.Restrict);

            // ✅ Invitation - Visitor (1 - N) ilişkisi
            builder.Entity<Visitor>()
                .HasOne(v => v.Invitation)
                .WithMany(i => i.Visitors)
                .HasForeignKey(v => v.InvitationId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
