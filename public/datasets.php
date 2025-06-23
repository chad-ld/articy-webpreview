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

        // Check if it's a directory (4.x format)
        if (is_dir($itemPath)) {
            $foundDirectories[] = $item;

            // Check if directory name contains .json (more flexible than just ending)
            if (strpos($item, '.json') !== false) {
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
                                // Remove .json from anywhere in the name (more flexible)
                                $datasetName = str_replace('.json', '', $item);
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
                                
                                // Find the newest file in this dataset folder
                                $newestTimestamp = getNewestFileTimestamp($itemPath);

                                // Get Articy version from manifest
                                $articyVersion = '4.x';
                                if (isset($manifest['Settings']['ExportVersion'])) {
                                    $articyVersion = '4.x v' . $manifest['Settings']['ExportVersion'];
                                }

                                // Try to find and extract subtitle from HTMLPREVIEW node
                                $subtitle = findHtmlPreviewSubtitle($itemPath);
                                if ($subtitle) {
                                    $displayName = $displayName . ' - ' . $subtitle;
                                }

                                // Add to datasets array
                                $response['datasets'][] = [
                                    'name' => $datasetName,
                                    'folder' => $item,
                                    'displayName' => $displayName,
                                    'description' => $description,
                                    'manifestPath' => $manifestPath,
                                    'lastModified' => $newestTimestamp,
                                    'lastModifiedFormatted' => date('Y-m-d H:i:s', $newestTimestamp),
                                    'articyVersion' => $articyVersion,
                                    'format' => '4.x',
                                    'valid' => true
                                ];
                                
                            } else {
                                // Invalid JSON in manifest
                                $datasetName = str_replace('.json', '', $item);
                                $response['datasets'][] = [
                                    'name' => $datasetName,
                                    'folder' => $item,
                                    'displayName' => ucfirst($datasetName),
                                    'description' => 'Invalid manifest.json',
                                    'manifestPath' => $manifestPath,
                                    'valid' => false,
                                    'error' => 'Invalid JSON in manifest.json'
                                ];
                            }
                        } else {
                            // Could not read manifest file
                            $datasetName = str_replace('.json', '', $item);
                            $response['datasets'][] = [
                                'name' => $datasetName,
                                'folder' => $item,
                                'displayName' => ucfirst($datasetName),
                                'description' => 'Could not read manifest.json',
                                'manifestPath' => $manifestPath,
                                'valid' => false,
                                'error' => 'Could not read manifest.json'
                            ];
                        }
                    } catch (Exception $e) {
                        // Error processing manifest
                        $datasetName = str_replace('.json', '', $item);
                        $response['datasets'][] = [
                            'name' => $datasetName,
                            'folder' => $item,
                            'displayName' => ucfirst($datasetName),
                            'description' => 'Error reading manifest',
                            'manifestPath' => $manifestPath,
                            'valid' => false,
                            'error' => $e->getMessage()
                        ];
                    }
                } else {
                    // No manifest.json found
                    $datasetName = str_replace('.json', '', $item);
                    $response['datasets'][] = [
                        'name' => $datasetName,
                        'folder' => $item,
                        'displayName' => ucfirst($datasetName),
                        'description' => 'No manifest.json found',
                        'manifestPath' => $manifestPath,
                        'valid' => false,
                        'error' => 'manifest.json not found or not readable'
                    ];
                }
            }
        }
        // Check if it's a single JSON file (3.x format)
        elseif (is_file($itemPath) && substr($item, -5) === '.json') {
            try {
                $fileContent = file_get_contents($itemPath);
                if ($fileContent !== false) {
                    $jsonData = json_decode($fileContent, true);

                    if ($jsonData !== null) {
                        // Check if it looks like 3.x format
                        $is3xFormat = isset($jsonData['Packages']) &&
                                     isset($jsonData['Project']) &&
                                     isset($jsonData['GlobalVariables']);

                        if ($is3xFormat) {
                            $datasetName = substr($item, 0, -5); // Remove .json extension
                            $displayName = '';
                            $description = '';
                            $articyVersion = '3.x';

                            // Try to get project name
                            if (isset($jsonData['Project']['Name'])) {
                                $displayName = $jsonData['Project']['Name'];
                            } elseif (isset($jsonData['Project']['DisplayName'])) {
                                $displayName = $jsonData['Project']['DisplayName'];
                            } else {
                                $displayName = ucfirst($datasetName);
                            }

                            // Try to get description
                            if (isset($jsonData['Project']['DetailName'])) {
                                $description = $jsonData['Project']['DetailName'];
                            } elseif (isset($jsonData['Project']['Description'])) {
                                $description = $jsonData['Project']['Description'];
                            } else {
                                $description = $datasetName . ' dataset (3.x format)';
                            }

                            // Get version info
                            if (isset($jsonData['Settings']['ExportVersion'])) {
                                $articyVersion = '3.x v' . $jsonData['Settings']['ExportVersion'];
                            }

                            // Try to find and extract subtitle from HTMLPREVIEW node in 3.x format
                            $subtitle = findHtmlPreviewSubtitle3x($jsonData);
                            if ($subtitle) {
                                $displayName = $displayName . ' - ' . $subtitle;
                            }

                            // Get file modification time
                            $lastModified = filemtime($itemPath);

                            // Add to datasets array
                            $response['datasets'][] = [
                                'name' => $datasetName,
                                'folder' => null, // Single file, not a folder
                                'file' => $item,
                                'displayName' => $displayName,
                                'description' => $description,
                                'filePath' => $itemPath,
                                'lastModified' => $lastModified,
                                'lastModifiedFormatted' => date('Y-m-d H:i:s', $lastModified),
                                'articyVersion' => $articyVersion,
                                'format' => '3.x',
                                'valid' => true
                            ];
                        }
                    }
                }
            } catch (Exception $e) {
                // Error processing 3.x file - skip silently or log if needed
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

/**
 * Get the timestamp of the newest file in a directory (recursive)
 * @param string $dir Directory path to scan
 * @return int Unix timestamp of the newest file
 */
function getNewestFileTimestamp($dir) {
    $newestTime = 0;

    if (!is_dir($dir)) {
        return $newestTime;
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $fileTime = $file->getMTime();
            if ($fileTime > $newestTime) {
                $newestTime = $fileTime;
            }
        }
    }

    return $newestTime;
}

/**
 * Find and extract subtitle from HTMLPREVIEW node in a 4.x dataset
 * @param string $datasetPath Path to the dataset folder
 * @return string|null The subtitle text or null if not found
 */
function findHtmlPreviewSubtitle($datasetPath) {
    // Look for the objects file that contains the node data
    $objectsFile = $datasetPath . '/package_010000060000401C_objects.json';

    if (!file_exists($objectsFile)) {
        return null;
    }

    try {
        $objectsContent = file_get_contents($objectsFile);
        if ($objectsContent === false) {
            return null;
        }

        $objectsData = json_decode($objectsContent, true);
        if ($objectsData === null || !isset($objectsData['Models'])) {
            return null;
        }

        // Search through all models for HTMLPREVIEW marker
        foreach ($objectsData['Models'] as $model) {
            if (!isset($model['Properties'])) {
                continue;
            }

            $properties = $model['Properties'];
            $textContent = '';

            // Check both Text and Expression properties for HTMLPREVIEW marker
            if (isset($properties['Text']) && strpos($properties['Text'], 'HTMLPREVIEW') !== false) {
                $textContent = $properties['Text'];
            } elseif (isset($properties['Expression']) && strpos($properties['Expression'], 'HTMLPREVIEW') !== false) {
                $textContent = $properties['Expression'];
            }

            if ($textContent) {
                // Extract subtitle from "Project Sub Name:" line
                $lines = explode("\n", $textContent);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (strpos($line, '//Project Sub Name:') === 0) {
                        $subtitle = trim(substr($line, strlen('//Project Sub Name:')));
                        if ($subtitle) {
                            return $subtitle;
                        }
                    }
                }
            }
        }

        return null;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Find and extract subtitle from HTMLPREVIEW node in a 3.x dataset
 * @param array $jsonData The parsed 3.x JSON data
 * @return string|null The subtitle text or null if not found
 */
function findHtmlPreviewSubtitle3x($jsonData) {
    if (!isset($jsonData['Packages'])) {
        return null;
    }

    try {
        // Search through all packages and models for HTMLPREVIEW marker
        foreach ($jsonData['Packages'] as $package) {
            if (!isset($package['Models'])) {
                continue;
            }

            foreach ($package['Models'] as $model) {
                if (!isset($model['Properties'])) {
                    continue;
                }

                $properties = $model['Properties'];
                $textContent = '';

                // Check both Text and Expression properties for HTMLPREVIEW marker
                if (isset($properties['Text']) && strpos($properties['Text'], 'HTMLPREVIEW') !== false) {
                    $textContent = $properties['Text'];
                } elseif (isset($properties['Expression']) && strpos($properties['Expression'], 'HTMLPREVIEW') !== false) {
                    $textContent = $properties['Expression'];
                }

                if ($textContent) {
                    // Extract subtitle from "Project Sub Name:" line
                    $lines = explode("\n", $textContent);
                    foreach ($lines as $line) {
                        $line = trim($line);
                        if (strpos($line, '//Project Sub Name:') === 0) {
                            $subtitle = trim(substr($line, strlen('//Project Sub Name:')));
                            if ($subtitle) {
                                return $subtitle;
                            }
                        }
                    }
                }
            }
        }

        return null;
    } catch (Exception $e) {
        return null;
    }
}
?>
