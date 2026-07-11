using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Context;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options);
