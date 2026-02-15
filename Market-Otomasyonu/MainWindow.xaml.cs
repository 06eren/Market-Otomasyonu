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
            InitializeAsync();
        }

        async void InitializeAsync()
        {
            try
            {
                // Define user data folder to persist cookies/sessions
                var userDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MarketOtomasyonu");
                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);

                await webView.EnsureCoreWebView2Async(env);

                // Map the frontend output folder to a virtual domain
                // Hardcoding the path for development phase as requested
                // In production, this should be relative to AppDomain.CurrentDomain.BaseDirectory
                var frontendPath = @"e:\CSharp\Market-Otomasyonu\frontend\out";
                
                if (!Directory.Exists(frontendPath))
                {
                    MessageBox.Show($"Frontend path not found: {frontendPath}\nPlease build the Next.js project first.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
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
                await productService.SeedInitialDataAsync();
                
                // Add Host Object for Interop
                webView.CoreWebView2.AddHostObjectToScript("productService", productService);

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