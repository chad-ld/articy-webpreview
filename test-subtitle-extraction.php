<?php
/**
 * Test script to debug subtitle extraction
 */

function findHtmlPreviewSubtitle($datasetPath) {
    echo "Testing subtitle extraction for: $datasetPath\n";
    
    // Look for the objects file that contains the node data
    $objectsFile = $datasetPath . '/package_010000060000401C_objects.json';
    
    echo "Looking for objects file: $objectsFile\n";
    
    if (!file_exists($objectsFile)) {
        echo "Objects file does not exist!\n";
        return null;
    }
    
    echo "Objects file exists, reading content...\n";
    
    try {
        $objectsContent = file_get_contents($objectsFile);
        if ($objectsContent === false) {
            echo "Could not read objects file!\n";
            return null;
        }
        
        echo "Objects file read successfully, parsing JSON...\n";
        
        $objectsData = json_decode($objectsContent, true);
        if ($objectsData === null || !isset($objectsData['Objects'])) {
            echo "Invalid JSON or no Objects found!\n";
            return null;
        }

        echo "Found " . count($objectsData['Objects']) . " objects, searching for HTMLPREVIEW...\n";

        // Search through all objects for HTMLPREVIEW marker
        foreach ($objectsData['Objects'] as $index => $model) {
            if (!isset($model['Properties'])) {
                continue;
            }
            
            $properties = $model['Properties'];
            $textContent = '';
            
            // Check both Text and Expression properties for HTMLPREVIEW marker
            if (isset($properties['Text']) && strpos($properties['Text'], 'HTMLPREVIEW') !== false) {
                $textContent = $properties['Text'];
                echo "Found HTMLPREVIEW in Text property of model $index\n";
            } elseif (isset($properties['Expression']) && strpos($properties['Expression'], 'HTMLPREVIEW') !== false) {
                $textContent = $properties['Expression'];
                echo "Found HTMLPREVIEW in Expression property of model $index\n";
            }
            
            if ($textContent) {
                echo "HTMLPREVIEW content: " . json_encode($textContent) . "\n";
                
                // Extract subtitle from "Project Sub Name:" line
                $lines = explode("\n", $textContent);
                echo "Split into " . count($lines) . " lines\n";
                
                foreach ($lines as $lineIndex => $line) {
                    $trimmedLine = trim($line);
                    echo "Line $lineIndex: " . json_encode($trimmedLine) . "\n";
                    
                    if (strpos($trimmedLine, '//Project Sub Name:') === 0) {
                        echo "Found Project Sub Name line!\n";
                        $subtitle = trim(substr($trimmedLine, strlen('//Project Sub Name:')));
                        echo "Extracted subtitle: " . json_encode($subtitle) . "\n";
                        if ($subtitle) {
                            return $subtitle;
                        }
                    }
                }
            }
        }
        
        echo "No HTMLPREVIEW with Project Sub Name found\n";
        return null;
    } catch (Exception $e) {
        echo "Exception: " . $e->getMessage() . "\n";
        return null;
    }
}

// Test the function
$datasetPath = 'public/mpos_nw.json';
$subtitle = findHtmlPreviewSubtitle($datasetPath);

echo "\nResult: " . ($subtitle ? "\"$subtitle\"" : "null") . "\n";
?>
