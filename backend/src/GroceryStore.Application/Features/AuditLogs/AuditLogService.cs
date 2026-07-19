using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace GroceryStore.Application.Features.AuditLogs;

public sealed record AuditLogEntry(
    int Id,
    string Time,
    string User,
    string Role,
    string Action,
    string Module,
    string Ip,
    string Status);

public sealed class AuditLogService
{
    private static readonly SemaphoreSlim SEMAPHORE = new(1, 1);
    private readonly string filePath;

    public AuditLogService()
    {
        filePath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "audit-logs.json");
    }

    public async Task<IReadOnlyCollection<AuditLogEntry>> GetLogsAsync(CancellationToken cancellationToken)
    {
        await SEMAPHORE.WaitAsync(cancellationToken);
        try
        {
            if (!File.Exists(filePath))
            {
                return Array.Empty<AuditLogEntry>();
            }

            var json = await File.ReadAllTextAsync(filePath, cancellationToken);
            return JsonSerializer.Deserialize<List<AuditLogEntry>>(json) ?? new List<AuditLogEntry>();
        }
        catch
        {
            return Array.Empty<AuditLogEntry>();
        }
        finally
        {
            SEMAPHORE.Release();
        }
    }

    public async Task LogAsync(string user, string role, string action, string module, string ip, string status, CancellationToken cancellationToken)
    {
        await SEMAPHORE.WaitAsync(cancellationToken);
        try
        {
            var logs = new List<AuditLogEntry>();
            if (File.Exists(filePath))
            {
                try
                {
                    var json = await File.ReadAllTextAsync(filePath, cancellationToken);
                    logs = JsonSerializer.Deserialize<List<AuditLogEntry>>(json) ?? new List<AuditLogEntry>();
                }
                catch
                {
                    logs = new List<AuditLogEntry>();
                }
            }

            var nextId = logs.Count > 0 ? logs[0].Id + 1 : 1;
            // Insert at the top so newer items appear first
            logs.Insert(0, new AuditLogEntry(
                nextId,
                DateTime.UtcNow.AddHours(7).ToString("yyyy-MM-dd HH:mm:ss"), // UTC+7 local time
                user,
                role,
                action,
                module,
                ip,
                status
            ));

            // Cap logs count
            if (logs.Count > 500)
            {
                logs = logs.GetRange(0, 500);
            }

            var dir = Path.GetDirectoryName(filePath);
            if (dir is not null && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            var serialized = JsonSerializer.Serialize(logs, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(filePath, serialized, cancellationToken);
        }
        catch
        {
            // Fail silently to prevent breaking the main transaction flow
        }
        finally
        {
            SEMAPHORE.Release();
        }
    }

    private static List<AuditLogEntry> GetDefaultLogs()
    {
        return new List<AuditLogEntry>
        {
            new(10, "2026-07-13 16:45:12", "manager@store.com", "Manager", "Nhập lô hàng mới (Mã lô: BATCH-092)", "Kho hàng", "192.168.1.15", "Success"),
            new(9, "2026-07-13 15:20:08", "seller@store.com", "Seller", "Thực hiện thanh toán POS đơn #10429", "Bán hàng", "192.168.1.20", "Success"),
            new(8, "2026-07-13 14:10:55", "admin@store.com", "Admin", "Cập nhật cấu hình hệ thống: Tắt online ordering", "Cài đặt", "192.168.1.2", "Success"),
            new(7, "2026-07-13 13:58:33", "seller@store.com", "Seller", "Hủy thanh toán POS đơn #10428 (Lý do: Khách đổi ý)", "Bán hàng", "192.168.1.20", "Warning"),
            new(6, "2026-07-13 12:00:00", "system_worker", "System", "Tự động thu hồi giữ tồn kho 10m cho Variant #12", "Đơn hàng", "127.0.0.1", "Success"),
            new(5, "2026-07-13 09:12:44", "manager@store.com", "Manager", "Thêm sản phẩm mới (Rau Bina hữu cơ Đà Lạt)", "Sản phẩm", "192.168.1.15", "Success"),
            new(4, "2026-07-12 18:30:19", "system_worker", "System", "Phát hiện lô rau tươi sắp hết hạn cảnh báo 18:00 ngày mai", "Kho hàng", "127.0.0.1", "Warning"),
            new(3, "2026-07-12 17:05:00", "buyer@store.com", "Buyer", "Gửi phản hồi đánh giá sản phẩm (Đơn hàng #10385)", "Đánh giá", "115.75.12.98", "Success"),
            new(2, "2026-07-12 11:22:10", "admin@store.com", "Admin", "Mở khóa kích hoạt tài khoản nhân viên (seller@store.com)", "Hệ thống", "192.168.1.2", "Success"),
            new(1, "2026-07-12 08:15:33", "unknown_ip", "Guest", "Đăng nhập thất bại quá 5 lần (Tài khoản: test_attacker)", "Hệ thống", "203.162.4.55", "Error")
        };
    }
}
