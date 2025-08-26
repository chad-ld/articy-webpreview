# .htaccess Test Suite for Articy Web Viewer

This is a simple test to verify that your web server's `.htaccess` configuration is working correctly for the Articy Web Viewer.

## 📋 What This Tests

1. **JSON File Access** - Ensures dataset JSON files are served directly (not routed to index.html)
2. **PHP File Access** - Ensures PHP API endpoints are executed properly
3. **SPA Routing** - Ensures non-existent routes fallback to index.html for React Router
4. **Static Assets** - Ensures CSS/JS files are served with correct content types

## 🚀 How to Use

1. **Upload all files** from this `test-htaccess` folder to your web server
2. **Navigate to the uploaded location** in your browser (e.g., `https://yoursite.com/test-htaccess/`)
3. **Click "Run Tests"** to execute all tests
4. **Review results** - all tests should show ✅ PASSED

## 📁 Files Included

- `index.html` - Main test interface
- `test-data.json` - Test JSON file
- `test-api.php` - Test PHP endpoint
- `test-style.css` - Test CSS file
- `.htaccess` - Apache configuration file
- `README.md` - This file

## ✅ Expected Results

If your `.htaccess` is working correctly, you should see:

- ✅ **JSON File Access - PASSED** - JSON files served with correct content-type
- ✅ **PHP File Access - PASSED** - PHP files executed and return JSON response
- ✅ **SPA Routing - PASSED** - Non-existent routes return index.html
- ✅ **Static Assets - PASSED** - CSS files served with correct content-type

## ❌ Troubleshooting

If tests fail, check:

1. **File Upload** - Ensure all files (including `.htaccess`) are uploaded
2. **File Permissions** - Set `.htaccess` to 644 permissions
3. **Server Support** - Verify your server supports `.htaccess` files
4. **mod_rewrite** - Ensure Apache mod_rewrite module is enabled
5. **PHP Support** - Ensure PHP is enabled on your server

## 🔧 Common Issues

### "JSON File Access - FAILED"
- The server is routing JSON requests to index.html instead of serving the file directly
- Check that `.htaccess` file is uploaded and has correct permissions

### "PHP File Access - FAILED"  
- PHP is not enabled or not working on your server
- Check that your hosting supports PHP

### "SPA Routing - FAILED"
- The fallback to index.html is not working
- Check mod_rewrite is enabled and `.htaccess` is being processed

### "Static Assets - FAILED"
- CSS files are not being served with correct content-type
- Check server configuration for static file handling

## 🎯 Next Steps

Once all tests pass:

1. **Delete this test folder** from your server
2. **Upload your actual Articy Web Viewer** build files
3. **Copy the working `.htaccess`** to your main application folder
4. **Test your actual application** with real dataset files

The same `.htaccess` configuration that makes these tests pass will make your Articy Web Viewer work correctly on your web server.
