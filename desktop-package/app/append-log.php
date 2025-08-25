<?php
/**
 * DISABLED - Real-Time Log Append Endpoint (Legacy)
 * This file has been disabled in favor of simple batch logging
 * Maintains persistent log files per browser session and appends individual log entries
 */

// This endpoint is disabled - return error
http_response_code(410);
echo json_encode(['error' => 'Real-time logging endpoint disabled - use simple batch logging instead']);
exit();

/*

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
    
    if (!$data || !isset($data['sessionId']) || !isset($data['logEntry'])) {
        throw new Exception('Invalid request data - sessionId and logEntry required');
    }
    
    $sessionId = $data['sessionId'];
    $logEntry = $data['logEntry'];
    $action = isset($data['action']) ? $data['action'] : 'append';
    
    // Validate session ID (security check)
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $sessionId)) {
        throw new Exception('Invalid session ID format');
    }
    
    // Ensure logs directory exists
    $logsDir = '../logs';
    if (!is_dir($logsDir)) {
        if (!mkdir($logsDir, 0755, true)) {
            throw new Exception('Failed to create logs directory');
        }
    }
    
    // Create session-specific log file path
    $logFilename = "console-session-{$sessionId}.log";
    $logFilepath = $logsDir . '/' . $logFilename;
    
    switch ($action) {
        case 'init':
            // Initialize new session log file
            $header = "# Console Log Session\n";
            $header .= "# Session ID: {$sessionId}\n";
            $header .= "# Started: " . date('Y-m-d H:i:s T') . "\n";
            $header .= "# Real-time logging enabled\n";
            $header .= "\n";
            
            if (file_put_contents($logFilepath, $header) === false) {
                throw new Exception('Failed to initialize log file');
            }
            
            $response = [
                'success' => true,
                'action' => 'init',
                'message' => "Session log initialized: {$logFilename}",
                'sessionId' => $sessionId,
                'logFile' => $logFilename
            ];
            break;
            
        case 'append':
            // Append log entry to existing file
            $timestamp = date('Y-m-d H:i:s.v T');
            $formattedEntry = "[{$timestamp}] {$logEntry}\n";
            
            if (file_put_contents($logFilepath, $formattedEntry, FILE_APPEND | LOCK_EX) === false) {
                throw new Exception('Failed to append to log file');
            }
            
            $response = [
                'success' => true,
                'action' => 'append',
                'message' => 'Log entry appended',
                'sessionId' => $sessionId,
                'entryLength' => strlen($formattedEntry)
            ];
            break;
            
        case 'heartbeat':
            // Update session activity timestamp
            $heartbeatFile = $logsDir . "/session-{$sessionId}.heartbeat";
            $heartbeatData = [
                'sessionId' => $sessionId,
                'lastActivity' => time(),
                'timestamp' => date('Y-m-d H:i:s T'),
                'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
            ];
            
            if (file_put_contents($heartbeatFile, json_encode($heartbeatData)) === false) {
                throw new Exception('Failed to update session heartbeat');
            }
            
            $response = [
                'success' => true,
                'action' => 'heartbeat',
                'message' => 'Session heartbeat updated',
                'sessionId' => $sessionId,
                'lastActivity' => $heartbeatData['lastActivity']
            ];
            break;
            
        case 'close':
            // Close session and finalize log file
            $footer = "\n# Session closed: " . date('Y-m-d H:i:s T') . "\n";
            $footer .= "# End of session log\n";
            
            if (file_put_contents($logFilepath, $footer, FILE_APPEND | LOCK_EX) === false) {
                throw new Exception('Failed to close log file');
            }
            
            // Remove heartbeat file
            $heartbeatFile = $logsDir . "/session-{$sessionId}.heartbeat";
            if (file_exists($heartbeatFile)) {
                unlink($heartbeatFile);
            }
            
            $response = [
                'success' => true,
                'action' => 'close',
                'message' => "Session log closed: {$logFilename}",
                'sessionId' => $sessionId,
                'logFile' => $logFilename
            ];
            break;
            
        default:
            throw new Exception('Invalid action specified');
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'action' => $action ?? 'unknown'
    ]);
}
*/
?>
