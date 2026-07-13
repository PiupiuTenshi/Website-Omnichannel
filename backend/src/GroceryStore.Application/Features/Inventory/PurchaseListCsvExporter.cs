using System.Globalization;
using System.Text;

namespace GroceryStore.Application.Features.Inventory;

public static class PurchaseListCsvExporter
{
    public static byte[] Export(IReadOnlyList<LowStockItemResponse> items)
    {
        var builder = new StringBuilder("Product,Variant,SKU,Unit,Available quantity,Suggested purchase quantity\r\n");
        foreach (var item in items)
        {
            builder.Append(Escape(item.ProductName)).Append(',')
                .Append(Escape(item.VariantName)).Append(',')
                .Append(Escape(item.Sku)).Append(',')
                .Append(Escape(item.UnitCode)).Append(',')
                .Append(item.AvailableQuantity.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(item.SuggestedPurchaseQuantity.ToString(CultureInfo.InvariantCulture)).Append("\r\n");
        }

        return new UTF8Encoding(true).GetBytes(builder.ToString());
    }

    private static string Escape(string value) => value.IndexOfAny([',', '"', '\r', '\n']) < 0 ? value : $"\"{value.Replace("\"", "\"\"")}\"";
}
