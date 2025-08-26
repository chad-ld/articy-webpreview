# Datasets Folder

This folder is for your Articy Draft JSON dataset files.

## How to add datasets:

### For 4.x format (Articy Draft X):
1. Export your project from Articy Draft X as JSON
2. Copy the entire exported folder (e.g., "myproject.json") into this datasets folder
3. The folder should contain files like:
   - manifest.json
   - global_variables.json
   - hierarchy.json
   - object_definitions.json
   - package_*.json files

### For 3.x format (Articy Draft 3):
1. Export your project from Articy Draft 3 as JSON
2. Copy the exported JSON file (e.g., "myproject.json") directly into this datasets folder

## Example structure:
```
datasets/
├── myproject.json/          # 4.x format (folder)
│   ├── manifest.json
│   ├── global_variables.json
│   └── ...
└── oldproject.json          # 3.x format (single file)
```

The application will automatically detect and list all datasets in this folder.
