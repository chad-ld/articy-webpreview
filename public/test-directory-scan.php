<?php
// Simple PHP test to verify directory scanning works on your web server
// Upload this to your public folder and access via browser

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Directory Scan Test - DreamHost</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { color: #28a745; background: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .error { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .info { color: #0c5460; background: #d1ecf1; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .dataset { background: #e9ecef; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #007bff; }
        .file-list { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: monospace; font-size: 12px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Directory Scan Test</h1>
        <p>Testing PHP directory scanning capabilities on your DreamHost server...</p>

        <?php
        echo "<div class='info'><strong>Server Info:</strong><br>";
        echo "PHP Version: " . phpversion() . "<br>";
        echo "Current Directory: " . __DIR__ . "<br>";
        echo "Script Path: " . __FILE__ . "<br>";
        echo "Web Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
        echo "</div>";

        // Test 1: Basic directory reading
        echo "<h2>📁 Test 1: Basic Directory Reading</h2>";
        $currentDir = __DIR__;
        
        if (is_readable($currentDir)) {
            echo "<div class='success'>✅ Directory is readable: $currentDir</div>";
            
            $items = scandir($currentDir);
            if ($items !== false) {
                echo "<div class='success'>✅ scandir() function works</div>";
                echo "<div class='file-list'><strong>All items in current directory:</strong><br>";
                foreach ($items as $item) {
                    if ($item !== '.' && $item !== '..') {
                        $itemPath = $currentDir . '/' . $item;
                        $type = is_dir($itemPath) ? '[DIR]' : '[FILE]';
                        $size = is_file($itemPath) ? ' (' . filesize($itemPath) . ' bytes)' : '';
                        echo "$type $item$size<br>";
                    }
                }
                echo "</div>";
            } else {
                echo "<div class='error'>❌ scandir() failed</div>";
            }
        } else {
            echo "<div class='error'>❌ Directory is not readable: $currentDir</div>";
        }

        // Test 2: Look for .json directories specifically
        echo "<h2>📦 Test 2: Dataset Detection (.json directories)</h2>";
        
        $jsonDirs = [];
        $allDirs = [];
        
        foreach ($items as $item) {
            if ($item !== '.' && $item !== '..') {
                $itemPath = $currentDir . '/' . $item;
                if (is_dir($itemPath)) {
                    $allDirs[] = $item;
                    if (substr($item, -5) === '.json') {
                        $jsonDirs[] = $item;
                    }
                }
            }
        }
        
        echo "<div class='info'><strong>All directories found:</strong> " . count($allDirs) . "<br>";
        if (!empty($allDirs)) {
            echo implode(', ', $allDirs);
        } else {
            echo "None";
        }
        echo "</div>";
        
        echo "<div class='info'><strong>Directories ending in .json:</strong> " . count($jsonDirs) . "<br>";
        if (!empty($jsonDirs)) {
            echo implode(', ', $jsonDirs);
        } else {
            echo "None found";
        }
        echo "</div>";

        // Test 3: Check each .json directory for manifest.json
        echo "<h2>📋 Test 3: Manifest Detection</h2>";
        
        $validDatasets = [];
        
        foreach ($jsonDirs as $jsonDir) {
            echo "<div class='dataset'>";
            echo "<h3>🔍 Checking: $jsonDir</h3>";
            
            $manifestPath = $currentDir . '/' . $jsonDir . '/manifest.json';
            echo "Looking for: $manifestPath<br>";
            
            if (file_exists($manifestPath)) {
                echo "<span style='color: green;'>✅ manifest.json exists</span><br>";
                
                if (is_readable($manifestPath)) {
                    echo "<span style='color: green;'>✅ manifest.json is readable</span><br>";
                    
                    $manifestContent = file_get_contents($manifestPath);
                    if ($manifestContent !== false) {
                        echo "<span style='color: green;'>✅ manifest.json content loaded</span><br>";
                        
                        $manifest = json_decode($manifestContent, true);
                        if ($manifest !== null) {
                            echo "<span style='color: green;'>✅ manifest.json is valid JSON</span><br>";
                            
                            $projectName = isset($manifest['Project']['Name']) ? $manifest['Project']['Name'] : 'Unknown Project';
                            $projectDetail = isset($manifest['Project']['DetailName']) ? $manifest['Project']['DetailName'] : 'No description';
                            
                            echo "<strong>Project Name:</strong> $projectName<br>";
                            echo "<strong>Description:</strong> $projectDetail<br>";
                            
                            $validDatasets[] = [
                                'name' => str_replace('.json', '', $jsonDir),
                                'folder' => $jsonDir,
                                'displayName' => $projectName,
                                'description' => $projectDetail
                            ];
                            
                        } else {
                            echo "<span style='color: red;'>❌ manifest.json is not valid JSON</span><br>";
                            echo "<pre>" . htmlspecialchars(substr($manifestContent, 0, 200)) . "...</pre>";
                        }
                    } else {
                        echo "<span style='color: red;'>❌ Could not read manifest.json content</span><br>";
                    }
                } else {
                    echo "<span style='color: red;'>❌ manifest.json is not readable</span><br>";
                }
            } else {
                echo "<span style='color: red;'>❌ manifest.json does not exist</span><br>";
            }
            echo "</div>";
        }

        // Test 4: Final JSON output (what the API would return)
        echo "<h2>🎯 Test 4: Final API Output</h2>";
        
        if (!empty($validDatasets)) {
            echo "<div class='success'>✅ Found " . count($validDatasets) . " valid dataset(s)</div>";
            echo "<pre>" . json_encode($validDatasets, JSON_PRETTY_PRINT) . "</pre>";
        } else {
            echo "<div class='error'>❌ No valid datasets found</div>";
        }

        // Test 5: Permission check
        echo "<h2>🔐 Test 5: Permission Check</h2>";
        
        $permissions = substr(sprintf('%o', fileperms($currentDir)), -4);
        echo "<div class='info'>";
        echo "<strong>Directory permissions:</strong> $permissions<br>";
        echo "<strong>Owner readable:</strong> " . (is_readable($currentDir) ? 'Yes' : 'No') . "<br>";
        echo "<strong>Owner writable:</strong> " . (is_writable($currentDir) ? 'Yes' : 'No') . "<br>";
        echo "</div>";
        ?>

        <h2>📝 Next Steps</h2>
        <div class="info">
            <p><strong>If this test shows valid datasets:</strong></p>
            <ul>
                <li>✅ PHP directory scanning works on your server</li>
                <li>✅ We can proceed with the hybrid detection system</li>
                <li>✅ The API will be able to auto-detect your datasets</li>
            </ul>
            
            <p><strong>If this test fails:</strong></p>
            <ul>
                <li>❌ Check file permissions on your server</li>
                <li>❌ Verify .json directories are uploaded correctly</li>
                <li>❌ We may need to use the fallback detection method</li>
            </ul>
        </div>

        <p><em>Upload this file to your web server and access it via browser to test directory scanning capabilities.</em></p>
    </div>
</body>
</html>
