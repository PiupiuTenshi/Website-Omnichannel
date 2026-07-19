using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var client = new HttpClient();
        var response = await client.GetAsync(""http://localhost:5261/api/admin/inventory/low-stock"");
        Console.WriteLine(response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Console.WriteLine(content);
    }
}
