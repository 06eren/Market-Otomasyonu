using System;
using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace Market_Otomasyonu
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            Loaded += async (_, _) => await InitializeAsync();
        }

        async Task InitializeAsync()
        {
            try
            {
                // Define user data folder to persist cookies/sessions
                var userDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MarketOtomasyonu");
                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);

                await webView.EnsureCoreWebView2Async(env);

                // Frontend path resolution: wwwroot next to the executable
                var basePath = AppDomain.CurrentDomain.BaseDirectory;
                var frontendPath = Path.Combine(basePath, "wwwroot");

                // In DEBUG mode, also check solution-relative frontend/out
#if DEBUG
                if (!Directory.Exists(frontendPath))
                {
                    var solutionDir = Path.GetFullPath(Path.Combine(basePath, "..", "..", "..", ".."));
                    var devPath = Path.Combine(solutionDir, "frontend", "out");
                    if (Directory.Exists(devPath))
                        frontendPath = devPath;
                }
#endif

                if (!Directory.Exists(frontendPath))
                {
                    MessageBox.Show($"Frontend dosyaları bulunamadı!\n\nAranan konum:\n{frontendPath}\n\nLütfen önce Next.js projesini build edin:\ncd frontend && npm run build", "Hata", MessageBoxButton.OK, MessageBoxImage.Error);
                    return;
                }

                webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "market.app", 
                    frontendPath, 
                    CoreWebView2HostResourceAccessKind.Allow
                );

                // Disable developer tools and context menus as requested
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
                webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                
                // Allow interactions
                webView.CoreWebView2.Settings.IsScriptEnabled = true;
                webView.CoreWebView2.Settings.IsWebMessageEnabled = true;

                // Backend Integration
                var productService = new Services.ProductService();
                var saleService = new Services.SaleService();
                var customerService = new Services.CustomerService();
                var settingsService = new Services.SettingsService();
                var authService = new Services.AuthService();
                var accountingService = new Services.AccountingService();
                
                await productService.SeedInitialDataAsync();
                authService.EnsureDatabase();
                
                // Add Host Objects for Interop
                webView.CoreWebView2.AddHostObjectToScript("productService", productService);
                webView.CoreWebView2.AddHostObjectToScript("saleService", saleService);
                webView.CoreWebView2.AddHostObjectToScript("customerService", customerService);
                webView.CoreWebView2.AddHostObjectToScript("settingsService", settingsService);
                webView.CoreWebView2.AddHostObjectToScript("authService", authService);
                webView.CoreWebView2.AddHostObjectToScript("accountingService", accountingService);

                // Navigate to the app
                webView.CoreWebView2.Navigate("http://market.app/index.html");
            }
            catch (Exception ex)
            {
                var message = $"WebView2 Initialization Failed: {ex.Message}";
                if (ex.InnerException != null)
                {
                    message += $"\nInner Exception: {ex.InnerException.Message}";
                }
                MessageBox.Show(message, "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
}