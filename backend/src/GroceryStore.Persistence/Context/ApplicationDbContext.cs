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

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<UnitOfMeasure> UnitsOfMeasure => Set<UnitOfMeasure>();

    public DbSet<Product> Products => Set<Product>();

    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();

    public DbSet<ProductImage> ProductImages => Set<ProductImage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUsers(modelBuilder);
        ConfigureRoles(modelBuilder);
        ConfigureRefreshSessions(modelBuilder);
        ConfigureStoreSettings(modelBuilder);
        ConfigureCatalog(modelBuilder);
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

    private static void ConfigureCatalog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(category => category.CategoryId);
            entity.Property(category => category.Name).HasMaxLength(150).IsRequired();
            entity.Property(category => category.Slug).HasMaxLength(160).IsRequired();
            entity.HasIndex(category => category.Slug).IsUnique();
            entity.HasIndex(category => category.ParentCategoryId);
            entity.HasOne<Category>()
                .WithMany()
                .HasForeignKey(category => category.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UnitOfMeasure>(entity =>
        {
            entity.HasKey(unitOfMeasure => unitOfMeasure.UnitOfMeasureId);
            entity.Property(unitOfMeasure => unitOfMeasure.Code).HasMaxLength(20).IsRequired();
            entity.Property(unitOfMeasure => unitOfMeasure.Name).HasMaxLength(100).IsRequired();
            entity.HasIndex(unitOfMeasure => unitOfMeasure.Code).IsUnique();
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_UnitsOfMeasure_DecimalScale",
                "([AllowsDecimal] = 1 AND [DecimalScale] BETWEEN 1 AND 3) OR ([AllowsDecimal] = 0 AND [DecimalScale] = 0)"));
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(product => product.ProductId);
            entity.Property(product => product.Name).HasMaxLength(250).IsRequired();
            entity.Property(product => product.Slug).HasMaxLength(260).IsRequired();
            entity.Property(product => product.Description).HasMaxLength(4000);
            entity.HasIndex(product => product.Slug).IsUnique();
            entity.HasIndex(product => product.CategoryId);
            entity.HasIndex(product => product.UnitOfMeasureId);
            entity.HasOne(product => product.Category)
                .WithMany()
                .HasForeignKey(product => product.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(product => product.UnitOfMeasure)
                .WithMany()
                .HasForeignKey(product => product.UnitOfMeasureId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(variant => variant.ProductVariantId);
            entity.Property(variant => variant.Name).HasMaxLength(150).IsRequired();
            entity.Property(variant => variant.Sku).HasMaxLength(64).IsRequired();
            entity.Property(variant => variant.Barcode).HasMaxLength(64);
            entity.Property(variant => variant.SellingPrice).HasPrecision(18, 2).IsRequired();
            entity.Property(variant => variant.CompareAtPrice).HasPrecision(18, 2);
            entity.Property(variant => variant.RowVersion).IsRowVersion();
            entity.HasIndex(variant => variant.ProductId);
            entity.HasIndex(variant => variant.Sku).IsUnique();
            entity.HasIndex(variant => variant.Barcode).IsUnique().HasFilter("[Barcode] IS NOT NULL");
            entity.HasOne<Product>()
                .WithMany(product => product.Variants)
                .HasForeignKey(variant => variant.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_ProductVariants_ValidPrices",
                "[SellingPrice] > 0 AND ([CompareAtPrice] IS NULL OR [CompareAtPrice] > [SellingPrice])"));
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(image => image.ProductImageId);
            entity.Property(image => image.ObjectKey).HasMaxLength(500).IsRequired();
            entity.Property(image => image.ContentType).HasMaxLength(100).IsRequired();
            entity.HasIndex(image => new { image.ProductId, image.SortOrder })
                .HasDatabaseName("IX_ProductImages_ProductId_SortOrder");
            entity.HasIndex(image => image.ProductId)
                .HasDatabaseName("UX_ProductImages_Primary")
                .IsUnique()
                .HasFilter("[IsPrimary] = 1");
            entity.HasOne<Product>()
                .WithMany(product => product.Images)
                .HasForeignKey(image => image.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
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
