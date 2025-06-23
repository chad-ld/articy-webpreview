<?php
/**
 * Articy Dataset Detection API
 * Scans for .json directories relative to the script location
 * Returns dataset information as JSON for the web viewer
 */

// Set headers for JSON API response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Get the directory where this script is located
    $scriptDir = dirname(__FILE__);
    
    // Initialize response
    $response = [
        'success' => true,
        'datasets' => [],
        'debug' => [
            'script_location' => $scriptDir,
            'scan_directory' => $scriptDir,
            'php_version' => phpversion(),
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ];
    
    // Scan the script directory for .json directories
    $items = scandir($scriptDir);
    if ($items === false) {
        throw new Exception("Failed to scan directory: $scriptDir");
    }
    
    $foundDirectories = [];
    $jsonDirectories = [];
    
    foreach ($items as $item) {
        // Skip current and parent directory references
        if ($item === '.' || $item === '..') {
            continue;
        }
        
        $itemPath = $scriptDir . DIRECTORY_SEPARATOR . $item;
        
        // Check if it's a directory
        if (is_dir($itemPath)) {
            $foundDirectories[] = $item;
            
            // Check if directory name ends with .json
            if (substr($item, -5) === '.json') {
                $jsonDirectories[] = $item;
                
                // Try to read manifest.json from this directory
                $manifestPath = $itemPath . DIRECTORY_SEPARATOR . 'manifest.json';
                
                if (file_exists($manifestPath) && is_readable($manifestPath)) {
                    try {
                        $manifestContent = file_get_contents($manifestPath);
                        if ($manifestContent !== false) {
                            $manifest = json_decode($manifestContent, true);
                            
                            if ($manifest !== null) {
                                // Extract dataset information
                                $datasetName = substr($item, 0, -5); // Remove .json extension
                                $displayName = '';
                                $description = '';
                                
                                // Try to get project name from manifest
                                if (isset($manifest['Project']['Name'])) {
                                    $displayName = $manifest['Project']['Name'];
                                } elseif (isset($manifest['Project']['DisplayName'])) {
                                    $displayName = $manifest['Project']['DisplayName'];
                                } else {
                                    // Fallback to formatted dataset name
                                    $displayName = ucfirst($datasetName);
                                }
                                
                                // Try to get description
                                if (isset($manifest['Project']['DetailName'])) {
                                    $description = $manifest['Project']['DetailName'];
                                } elseif (isset($manifest['Project']['Description'])) {
                                    $description = $manifest['Project']['Description'];
                                }
                                
                                // Add to datasets array
                                $response['datasets'][] = [
                                    'name' => $datasetName,
                                    'folder' => $item,
                                    'displayName' => $displayName,
                                    'description' => $description,
                                    'manifestPath' => $manifestPath,
                                    'valid' => true
                                ];
                                
                            } else {
                                // Invalid JSON in manifest
                                $response['datasets'][] = [
                                    'name' => substr($item, 0, -5),
                                    'folder' => $item,
                                    'displayName' => ucfirst(substr($item, 0, -5)),
                                    'description' => 'Invalid manifest.json',
                                    'manifestPath' => $manifestPath,
                                    'valid' => false,
                                    'error' => 'Invalid JSON in manifest.json'
                                ];
                            }
                        } else {
                            // Could not read manifest file
                            $response['datasets'][] = [
                                'name' => substr($item, 0, -5),
                                'folder' => $item,
                                'displayName' => ucfirst(substr($item, 0, -5)),
                                'description' => 'Could not read manifest.json',
                                'manifestPath' => $manifestPath,
                                'valid' => false,
                                'error' => 'Could not read manifest.json'
                            ];
                        }
                    } catch (Exception $e) {
                        // Error processing manifest
                        $response['datasets'][] = [
                            'name' => substr($item, 0, -5),
                            'folder' => $item,
                            'displayName' => ucfirst(substr($item, 0, -5)),
                            'description' => 'Error reading manifest',
                            'manifestPath' => $manifestPath,
                            'valid' => false,
                            'error' => $e->getMessage()
                        ];
                    }
                } else {
                    // No manifest.json found
                    $response['datasets'][] = [
                        'name' => substr($item, 0, -5),
                        'folder' => $item,
                        'displayName' => ucfirst(substr($item, 0, -5)),
                        'description' => 'No manifest.json found',
                        'manifestPath' => $manifestPath,
                        'valid' => false,
                        'error' => 'manifest.json not found or not readable'
                    ];
                }
            }
        }
    }
    
    // Add debug information
    $response['debug']['total_items'] = count($items);
    $response['debug']['directories_found'] = $foundDirectories;
    $response['debug']['json_directories'] = $jsonDirectories;
    $response['debug']['valid_datasets'] = count(array_filter($response['datasets'], function($d) { return $d['valid']; }));
    
    // Output JSON response
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'datasets' => [],
        'debug' => [
            'script_location' => dirname(__FILE__),
            'php_version' => phpversion(),
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_PRETTY_PRINT);
}
?>
