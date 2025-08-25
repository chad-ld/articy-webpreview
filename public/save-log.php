<?php
/**
 * Save Log File Endpoint
 * Saves console logs to the server's logs folder
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['filename']) || !isset($data['content'])) {
        throw new Exception('Invalid request data');
    }
    
    $filename = $data['filename'];
    $content = $data['content'];
    
    // Validate filename (security check)
    if (!preg_match('/^console-export-[\d-]+\.log$/', $filename)) {
        throw new Exception('Invalid filename format');
    }
    
    // Ensure logs directory exists
    $logsDir = '../logs';
    if (!is_dir($logsDir)) {
        if (!mkdir($logsDir, 0755, true)) {
            throw new Exception('Failed to create logs directory');
        }
    }
    
    // Save the log file
    $filepath = $logsDir . '/' . $filename;
    
    if (file_put_contents($filepath, $content) === false) {
        throw new Exception('Failed to write log file');
    }
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => "Log saved successfully to logs/{$filename}",
        'filename' => $filename,
        'size' => strlen($content)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
