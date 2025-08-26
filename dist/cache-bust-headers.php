<?php
// Cache Busting Headers for Testing
// Prevents browser caching during development testing

// Only apply to PHP files, not static assets
if (strpos($_SERVER['REQUEST_URI'], '.php') !== false) {
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
    header('ETag: "' . uniqid() . '"');
}
?>
