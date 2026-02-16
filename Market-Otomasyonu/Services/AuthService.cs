using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Market_Otomasyonu.Data;
using Market_Otomasyonu.Models;
using Microsoft.EntityFrameworkCore;

namespace Market_Otomasyonu.Services
{
    [ComVisible(true)]
    public class AuthService
    {
        private int? _currentEmployeeId;

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        public void EnsureDatabase()
        {
            using var ctx = new MarketContext();
            ctx.Database.EnsureCreated();

            // EnsureCreated won't add new tables to an existing DB, so create them manually
            ctx.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS Employees (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Username TEXT NOT NULL,
                    PasswordHash TEXT NOT NULL,
                    FullName TEXT NOT NULL,
                    Role INTEGER NOT NULL DEFAULT 2,
                    IsActive INTEGER NOT NULL DEFAULT 1,
                    CreatedAt TEXT NOT NULL,
                    LastLoginAt TEXT
                );
            ");
            ctx.Database.ExecuteSqlRaw(@"
                CREATE UNIQUE INDEX IF NOT EXISTS IX_Employees_Username ON Employees (Username);
            ");
            ctx.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ActivityLogs (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    EmployeeId INTEGER NOT NULL,
                    Action TEXT NOT NULL,
                    Detail TEXT NOT NULL DEFAULT '',
                    CreatedAt TEXT NOT NULL,
                    FOREIGN KEY (EmployeeId) REFERENCES Employees(Id)
                );
            ");

            // Seed default admin if no employees exist
            var anyEmployee = ctx.Employees.Any();
            if (!anyEmployee)
            {
                ctx.Employees.Add(new Employee
                {
                    Username = "admin",
                    PasswordHash = HashPassword("admin123"),
                    FullName = "Sistem Yöneticisi",
                    Role = EmployeeRole.Admin,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                });
                ctx.SaveChanges();
            }
        }

        // ── LOGIN / LOGOUT ──

        public async Task<string> LoginAsync(string username, string password)
        {
            try
            {
                using var ctx = new MarketContext();
                var hash = HashPassword(password);
                var emp = await ctx.Employees.FirstOrDefaultAsync(e =>
                    e.Username == username && e.PasswordHash == hash && e.IsActive);

                if (emp == null)
                    return "{\"success\":false,\"message\":\"Kullanıcı adı veya şifre hatalı!\"}";

                emp.LastLoginAt = DateTime.Now;
                ctx.ActivityLogs.Add(new ActivityLog
                {
                    EmployeeId = emp.Id,
                    Action = "LOGIN",
                    Detail = $"{emp.FullName} giriş yaptı",
                    CreatedAt = DateTime.Now
                });
                await ctx.SaveChangesAsync();

                _currentEmployeeId = emp.Id;

                var result = new
                {
                    success = true,
                    employee = new
                    {
                        emp.Id,
                        emp.Username,
                        emp.FullName,
                        Role = (int)emp.Role,
                        RoleName = emp.Role.ToString(),
                        LastLoginAt = emp.LastLoginAt?.ToString("dd.MM.yyyy HH:mm")
                    }
                };
                return JsonSerializer.Serialize(result);
            }
            catch (Exception ex)
            {
                return $"{{\"success\":false,\"message\":\"{ex.Message}\"}}";
            }
        }

        public async Task<string> LogoutAsync()
        {
            try
            {
                if (_currentEmployeeId.HasValue)
                {
                    using var ctx = new MarketContext();
                    ctx.ActivityLogs.Add(new ActivityLog
                    {
                        EmployeeId = _currentEmployeeId.Value,
                        Action = "LOGOUT",
                        Detail = "Oturum kapatıldı",
                        CreatedAt = DateTime.Now
                    });
                    await ctx.SaveChangesAsync();
                }
                _currentEmployeeId = null;
                return "{\"success\":true}";
            }
            catch (Exception ex)
            {
                return $"{{\"success\":false,\"message\":\"{ex.Message}\"}}";
            }
        }

        public string GetCurrentUser()
        {
            if (!_currentEmployeeId.HasValue)
                return "{\"loggedIn\":false}";

            try
            {
                using var ctx = new MarketContext();
                var emp = ctx.Employees.Find(_currentEmployeeId.Value);
                if (emp == null) { _currentEmployeeId = null; return "{\"loggedIn\":false}"; }

                return JsonSerializer.Serialize(new
                {
                    loggedIn = true,
                    employee = new
                    {
                        emp.Id,
                        emp.Username,
                        emp.FullName,
                        Role = (int)emp.Role,
                        RoleName = emp.Role.ToString(),
                        LastLoginAt = emp.LastLoginAt?.ToString("dd.MM.yyyy HH:mm")
                    }
                });
            }
            catch
            {
                return "{\"loggedIn\":false}";
            }
        }

        // ── EMPLOYEE CRUD ──

        public async Task<string> GetEmployeesAsync()
        {
            try
            {
                using var ctx = new MarketContext();
                var list = await ctx.Employees
                    .OrderBy(e => e.Role).ThenBy(e => e.FullName)
                    .Select(e => new
                    {
                        e.Id,
                        e.Username,
                        e.FullName,
                        Role = (int)e.Role,
                        RoleName = e.Role.ToString(),
                        e.IsActive,
                        CreatedAt = e.CreatedAt.ToString("dd.MM.yyyy"),
                        LastLoginAt = e.LastLoginAt != null ? e.LastLoginAt.Value.ToString("dd.MM.yyyy HH:mm") : "-"
                    })
                    .ToListAsync();
                return JsonSerializer.Serialize(list);
            }
            catch (Exception ex)
            {
                return $"[]";
            }
        }

        public async Task<string> AddEmployeeAsync(string json)
        {
            try
            {
                using var ctx = new MarketContext();
                var data = JsonSerializer.Deserialize<JsonElement>(json);

                var username = data.GetProperty("Username").GetString() ?? "";
                var password = data.GetProperty("Password").GetString() ?? "";
                var fullName = data.GetProperty("FullName").GetString() ?? "";
                var role = data.GetProperty("Role").GetInt32();

                if (string.IsNullOrWhiteSpace(username) || username.Length < 3)
                    return "{\"success\":false,\"message\":\"Kullanıcı adı en az 3 karakter olmalı.\"}";
                if (string.IsNullOrWhiteSpace(password) || password.Length < 4)
                    return "{\"success\":false,\"message\":\"Şifre en az 4 karakter olmalı.\"}";
                if (string.IsNullOrWhiteSpace(fullName))
                    return "{\"success\":false,\"message\":\"Ad soyad zorunludur.\"}";

                var exists = await ctx.Employees.AnyAsync(e => e.Username == username);
                if (exists)
                    return "{\"success\":false,\"message\":\"Bu kullanıcı adı zaten kullanılıyor.\"}";

                var emp = new Employee
                {
                    Username = username.Trim().ToLowerInvariant(),
                    PasswordHash = HashPassword(password),
                    FullName = fullName.Trim(),
                    Role = (EmployeeRole)role,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                ctx.Employees.Add(emp);
                await ctx.SaveChangesAsync();

                if (_currentEmployeeId.HasValue)
                {
                    ctx.ActivityLogs.Add(new ActivityLog
                    {
                        EmployeeId = _currentEmployeeId.Value,
                        Action = "EMPLOYEE_ADD",
                        Detail = $"Yeni personel eklendi: {emp.FullName} ({emp.Role})",
                        CreatedAt = DateTime.Now
                    });
                    await ctx.SaveChangesAsync();
                }

                return "{\"success\":true,\"message\":\"Personel başarıyla eklendi.\"}";
            }
            catch (Exception ex)
            {
                return $"{{\"success\":false,\"message\":\"{ex.Message}\"}}";
            }
        }

        public async Task<string> UpdateEmployeeAsync(string json)
        {
            try
            {
                using var ctx = new MarketContext();
                var data = JsonSerializer.Deserialize<JsonElement>(json);

                var id = data.GetProperty("Id").GetInt32();
                var emp = await ctx.Employees.FindAsync(id);
                if (emp == null)
                    return "{\"success\":false,\"message\":\"Personel bulunamadı.\"}";

                if (data.TryGetProperty("FullName", out var fn))
                    emp.FullName = fn.GetString()?.Trim() ?? emp.FullName;
                if (data.TryGetProperty("Role", out var r))
                    emp.Role = (EmployeeRole)r.GetInt32();
                if (data.TryGetProperty("IsActive", out var ia))
                    emp.IsActive = ia.GetBoolean();
                if (data.TryGetProperty("Password", out var pw))
                {
                    var newPw = pw.GetString() ?? "";
                    if (newPw.Length >= 4)
                        emp.PasswordHash = HashPassword(newPw);
                }

                await ctx.SaveChangesAsync();
                return "{\"success\":true,\"message\":\"Personel güncellendi.\"}";
            }
            catch (Exception ex)
            {
                return $"{{\"success\":false,\"message\":\"{ex.Message}\"}}";
            }
        }

        public async Task<string> DeleteEmployeeAsync(int id)
        {
            try
            {
                using var ctx = new MarketContext();
                var emp = await ctx.Employees.FindAsync(id);
                if (emp == null)
                    return "{\"success\":false,\"message\":\"Personel bulunamadı.\"}";

                if (emp.Role == EmployeeRole.Admin)
                {
                    var adminCount = await ctx.Employees.CountAsync(e => e.Role == EmployeeRole.Admin && e.IsActive);
                    if (adminCount <= 1)
                        return "{\"success\":false,\"message\":\"Son admin silinemez!\"}";
                }

                // soft delete
                emp.IsActive = false;
                await ctx.SaveChangesAsync();
                return "{\"success\":true,\"message\":\"Personel devre dışı bırakıldı.\"}";
            }
            catch (Exception ex)
            {
                return $"{{\"success\":false,\"message\":\"{ex.Message}\"}}";
            }
        }

        // ── ACTIVITY LOG ──

        public async Task<string> GetActivityLogAsync(int count = 50)
        {
            try
            {
                using var ctx = new MarketContext();
                var logs = await ctx.ActivityLogs
                    .Include(a => a.Employee)
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(count)
                    .Select(a => new
                    {
                        a.Id,
                        EmployeeName = a.Employee != null ? a.Employee.FullName : "Sistem",
                        a.Action,
                        a.Detail,
                        CreatedAt = a.CreatedAt.ToString("dd.MM.yyyy HH:mm:ss")
                    })
                    .ToListAsync();
                return JsonSerializer.Serialize(logs);
            }
            catch
            {
                return "[]";
            }
        }

        public async Task LogActionAsync(string action, string detail)
        {
            if (!_currentEmployeeId.HasValue) return;
            try
            {
                using var ctx = new MarketContext();
                ctx.ActivityLogs.Add(new ActivityLog
                {
                    EmployeeId = _currentEmployeeId.Value,
                    Action = action,
                    Detail = detail,
                    CreatedAt = DateTime.Now
                });
                await ctx.SaveChangesAsync();
            }
            catch { }
        }
    }
}
