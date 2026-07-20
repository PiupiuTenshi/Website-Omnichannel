using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GroceryStore.Persistence.Contexts;
using GroceryStore.Persistence.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

class Program {
    static async Task Main() {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(""Server=localhost;Database=GroceryStore;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True""));
        
        var sp = services.BuildServiceProvider();
        var context = sp.GetRequiredService<ApplicationDbContext>();
        
        var repo = new InventoryRepository(context);
        try {
            var items = await repo.GetLowStockItemsAsync(5m, default);
            Console.WriteLine(""Success, count: "" + items.Count);
        } catch (Exception ex) {
            Console.WriteLine(""Error: "" + ex.ToString());
        }
    }
}
