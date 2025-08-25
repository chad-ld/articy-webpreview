<?php
/**
 * Session Cleanup Script
 * Cleans up old log files and inactive sessions
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $logsDir = '../logs';
    $maxAge = 24 * 60 * 60; // 24 hours in seconds
    $inactiveThreshold = 60 * 60; // 1 hour in seconds
    
    if (!is_dir($logsDir)) {
        throw new Exception('Logs directory not found');
    }
    
    $cleanupStats = [
        'oldLogFiles' => 0,
        'inactiveSessions' => 0,
        'orphanedHeartbeats' => 0,
        'totalCleaned' => 0,
        'errors' => []
    ];
    
    $currentTime = time();
    
    // Get all files in logs directory
    $files = scandir($logsDir);
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        
        $filePath = $logsDir . '/' . $file;
        
        if (!is_file($filePath)) {
            continue;
        }
        
        $fileAge = $currentTime - filemtime($filePath);
        
        // Clean up old session log files (older than 24 hours)
        if (preg_match('/^console-session-[\d-T]+\.log$/', $file)) {
            if ($fileAge > $maxAge) {
                if (unlink($filePath)) {
                    $cleanupStats['oldLogFiles']++;
                    $cleanupStats['totalCleaned']++;
                } else {
                    $cleanupStats['errors'][] = "Failed to delete old log file: $file";
                }
            }
        }
        
        // Clean up heartbeat files for inactive sessions
        if (preg_match('/^session-([\d-T]+)\.heartbeat$/', $file, $matches)) {
            $sessionId = $matches[1];
            $sessionLogFile = $logsDir . "/console-session-{$sessionId}.log";
            
            // Check if heartbeat is old (session inactive)
            if ($fileAge > $inactiveThreshold) {
                // Close the session log file if it exists
                if (file_exists($sessionLogFile)) {
                    $footer = "\n# Session ended due to inactivity: " . date('Y-m-d H:i:s T') . "\n";
                    $footer .= "# Session was inactive for " . round($fileAge / 60) . " minutes\n";
                    $footer .= "# End of session log\n";
                    
                    if (file_put_contents($sessionLogFile, $footer, FILE_APPEND | LOCK_EX) !== false) {
                        $cleanupStats['inactiveSessions']++;
                        $cleanupStats['totalCleaned']++;
                    } else {
                        $cleanupStats['errors'][] = "Failed to close inactive session log: $sessionId";
                    }
                }
                
                // Remove the heartbeat file
                if (unlink($filePath)) {
                    $cleanupStats['orphanedHeartbeats']++;
                    $cleanupStats['totalCleaned']++;
                } else {
                    $cleanupStats['errors'][] = "Failed to delete heartbeat file: $file";
                }
            }
        }
        
        // Clean up orphaned heartbeat files (no corresponding log file)
        if (preg_match('/^session-([\d-T]+)\.heartbeat$/', $file, $matches)) {
            $sessionId = $matches[1];
            $sessionLogFile = $logsDir . "/console-session-{$sessionId}.log";
            
            if (!file_exists($sessionLogFile)) {
                if (unlink($filePath)) {
                    $cleanupStats['orphanedHeartbeats']++;
                    $cleanupStats['totalCleaned']++;
                } else {
                    $cleanupStats['errors'][] = "Failed to delete orphaned heartbeat file: $file";
                }
            }
        }
    }
    
    // Get current active sessions
    $activeSessions = [];
    $heartbeatFiles = glob($logsDir . '/session-*.heartbeat');
    
    foreach ($heartbeatFiles as $heartbeatFile) {
        $heartbeatData = json_decode(file_get_contents($heartbeatFile), true);
        if ($heartbeatData) {
            $activeSessions[] = [
                'sessionId' => $heartbeatData['sessionId'],
                'lastActivity' => $heartbeatData['lastActivity'],
                'timestamp' => $heartbeatData['timestamp'],
                'userAgent' => $heartbeatData['userAgent'] ?? 'Unknown',
                'minutesAgo' => round(($currentTime - $heartbeatData['lastActivity']) / 60)
            ];
        }
    }
    
    // Sort active sessions by last activity (most recent first)
    usort($activeSessions, function($a, $b) {
        return $b['lastActivity'] - $a['lastActivity'];
    });
    
    $response = [
        'success' => true,
        'message' => 'Session cleanup completed',
        'cleanup' => $cleanupStats,
        'activeSessions' => $activeSessions,
        'activeSessionCount' => count($activeSessions),
        'timestamp' => date('Y-m-d H:i:s T')
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s T')
    ]);
}
?>
