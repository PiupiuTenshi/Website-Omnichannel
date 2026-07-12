namespace GroceryStore.Domain.Entities;

public sealed class Category
{
    private Category()
    {
        Name = string.Empty;
        Slug = string.Empty;
    }

    public Category(string name, string slug, Guid? parentCategoryId, int sortOrder, bool isActive)
    {
        CategoryId = Guid.NewGuid();
        Name = name;
        Slug = slug;
        ParentCategoryId = parentCategoryId;
        SortOrder = sortOrder;
        IsActive = isActive;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = CreatedAtUtc;
    }

    public Guid CategoryId { get; private set; }

    public string Name { get; private set; }

    public string Slug { get; private set; }

    public Guid? ParentCategoryId { get; private set; }

    public int SortOrder { get; private set; }

    public bool IsActive { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public void Update(string name, string slug, Guid? parentCategoryId, int sortOrder, bool isActive)
    {
        if (parentCategoryId == CategoryId)
        {
            throw new ArgumentException("A category cannot be its own parent.", nameof(parentCategoryId));
        }

        Name = name;
        Slug = slug;
        ParentCategoryId = parentCategoryId;
        SortOrder = sortOrder;
        IsActive = isActive;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
