using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace Market_Otomasyonu.Services
{
    [ComVisible(true)]
    public class SettingsService
    {
        private readonly string _settingsPath;
        private readonly string _dbFolder;

        public SettingsService()
        {
            _dbFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MarketOtomasyonu");
            _settingsPath = Path.Combine(_dbFolder, "settings.json");
        }

        public async Task<string> GetSettingsAsync()
        {
            if (File.Exists(_settingsPath))
            {
                return await File.ReadAllTextAsync(_settingsPath);
            }
            // Default settings
            var defaults = new
            {
                StoreName = "MarketPro",
                Address = "",
                TaxNumber = "",
                Phone = "",
                TaxRate = 18,
                AutoPrint = true,
                DefaultPrinter = "Microsoft Print to PDF"
            };
            return System.Text.Json.JsonSerializer.Serialize(defaults);
        }

        public async Task<string> SaveSettingsAsync(string json)
        {
            try
            {
                if (!Directory.Exists(_dbFolder))
                    Directory.CreateDirectory(_dbFolder);

                await File.WriteAllTextAsync(_settingsPath, json);
                return "{\"success\":true}";
            }
            catch (Exception ex)
            {
                return System.Text.Json.JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public async Task<string> BackupDatabaseAsync()
        {
            try
            {
                var dbPath = Path.Combine(_dbFolder, "market.db");
                if (!File.Exists(dbPath))
                    return "{\"success\":false,\"message\":\"Veritabanı dosyası bulunamadı.\"}";

                var backupDir = Path.Combine(_dbFolder, "backups");
                if (!Directory.Exists(backupDir))
                    Directory.CreateDirectory(backupDir);

                var backupName = $"market_backup_{DateTime.Now:yyyyMMdd_HHmmss}.db";
                var backupPath = Path.Combine(backupDir, backupName);

                File.Copy(dbPath, backupPath, true);
                await Task.CompletedTask;
                return System.Text.Json.JsonSerializer.Serialize(new { success = true, message = $"Yedek başarıyla oluşturuldu: {backupName}" });
            }
            catch (Exception ex)
            {
                return System.Text.Json.JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public async Task<string> ResetDatabaseAsync()
        {
            try
            {
                var dbPath = Path.Combine(_dbFolder, "market.db");
                if (File.Exists(dbPath))
                {
                    // First backup
                    var backupDir = Path.Combine(_dbFolder, "backups");
                    if (!Directory.Exists(backupDir))
                        Directory.CreateDirectory(backupDir);
                    File.Copy(dbPath, Path.Combine(backupDir, $"pre_reset_{DateTime.Now:yyyyMMdd_HHmmss}.db"), true);
                    
                    File.Delete(dbPath);
                }
                // The app will recreate and seed on next restart
                await Task.CompletedTask;
                return "{\"success\":true,\"message\":\"Veritabanı sıfırlandı. Uygulama yeniden başlatıldığında veriler yeniden oluşturulacak.\"}";
            }
            catch (Exception ex)
            {
                return System.Text.Json.JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }
    }
}
