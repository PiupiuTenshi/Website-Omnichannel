using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;
using GroceryStore.Persistence.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Context;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole, string>(options)
{
    public DbSet<RefreshSession> RefreshSessions => Set<RefreshSession>();

    public DbSet<StoreSettings> StoreSettings => Set<StoreSettings>();

    public DbSet<StoreContactNumber> StoreContactNumbers => Set<StoreContactNumber>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUsers(modelBuilder);
        ConfigureRoles(modelBuilder);
        ConfigureRefreshSessions(modelBuilder);
        ConfigureStoreSettings(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(user => user.NormalizedPhoneNumber).HasMaxLength(15);
            entity.Property(user => user.IsActive).HasDefaultValue(true);
            entity.HasIndex(user => user.NormalizedEmail)
                .IsUnique()
                .HasFilter("[NormalizedEmail] IS NOT NULL");
            entity.HasIndex(user => user.NormalizedPhoneNumber)
                .IsUnique()
                .HasFilter("[NormalizedPhoneNumber] IS NOT NULL");
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_AspNetUsers_EmailOrPhone",
                "[NormalizedEmail] IS NOT NULL OR [NormalizedPhoneNumber] IS NOT NULL"));
        });
    }

    private static void ConfigureRoles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<IdentityRole>().HasData(
            CreateRole(UserRole.Admin),
            CreateRole(UserRole.Manager),
            CreateRole(UserRole.Seller),
            CreateRole(UserRole.Buyer));
    }

    private static void ConfigureRefreshSessions(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RefreshSession>(entity =>
        {
            entity.HasKey(session => session.RefreshSessionId);
            entity.Property(session => session.UserId).HasMaxLength(450).IsRequired();
            entity.Property(session => session.TokenHash).HasMaxLength(64).IsRequired();
            entity.HasIndex(session => session.TokenHash).IsUnique();
            entity.HasIndex(session => session.UserId);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(session => session.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureStoreSettings(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StoreSettings>(entity =>
        {
            entity.HasKey(settings => settings.StoreSettingsId);
            entity.Property(settings => settings.Name).HasMaxLength(200).IsRequired();
            entity.Property(settings => settings.Email).HasMaxLength(256);
            entity.Property(settings => settings.Address).HasMaxLength(500).IsRequired();
            entity.Property(settings => settings.IsOnlineOrderingEnabled).HasDefaultValue(true);
            entity.Property(settings => settings.RowVersion).IsRowVersion();
            entity.HasMany(settings => settings.ContactNumbers)
                .WithOne()
                .HasForeignKey(number => number.StoreSettingsId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StoreContactNumber>(entity =>
        {
            entity.HasKey(number => number.StoreContactNumberId);
            entity.Property(number => number.PhoneNumber).HasMaxLength(15).IsRequired();
            entity.HasIndex(number => number.StoreSettingsId);
            entity.HasIndex(number => new { number.StoreSettingsId, number.PhoneNumber }).IsUnique();
        });
    }

    private static IdentityRole CreateRole(UserRole role)
    {
        var roleName = role.ToString();
        return new IdentityRole
        {
            Id = IdentityRoleSeed.GetId(role),
            Name = roleName,
            NormalizedName = roleName.ToUpperInvariant(),
            ConcurrencyStamp = IdentityRoleSeed.GetConcurrencyStamp(role)
        };
    }
}
