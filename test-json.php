<?php
$content = file_get_contents('public/mpos_nw.json/package_010000060000401C_objects.json');
echo "File size: " . strlen($content) . " bytes\n";

$data = json_decode($content, true);
echo "JSON Error: " . json_last_error_msg() . "\n";

if ($data === null) {
    echo "JSON decode failed!\n";
    // Try to find the issue by checking the first few characters
    echo "First 200 characters: " . substr($content, 0, 200) . "\n";
} else {
    echo "JSON decode successful!\n";
    echo "Top-level keys: " . implode(', ', array_keys($data)) . "\n";
    if (isset($data['Models'])) {
        echo "Models count: " . count($data['Models']) . "\n";
    }
}
?>
