/**
 * Desktop Package Zipper
 * Creates a ZIP file from the desktop package for distribution
 */

import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DesktopPackageZipper {
  constructor() {
    this.packageDir = 'desktop-package';
    this.outputDir = 'builds';
    // Read package.json using fs since we can't use require in ES modules
    this.packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  }

  async createZipPackage() {
    console.log('📦 Creating ZIP package for distribution...');
    
    try {
      // Check if desktop package exists
      if (!await fs.pathExists(this.packageDir)) {
        throw new Error('Desktop package not found. Run "npm run build:desktop" first.');
      }
      
      // Ensure output directory exists
      await fs.ensureDir(this.outputDir);
      
      // Create ZIP file
      const zipFileName = this.generateZipFileName();
      const zipPath = path.join(this.outputDir, zipFileName);
      
      console.log(`📁 Creating ZIP file: ${zipFileName}`);
      
      const zip = new AdmZip();
      
      // Add all files from desktop package
      await this.addDirectoryToZip(zip, this.packageDir, 'articy-desktop-viewer');
      
      // Write ZIP file
      zip.writeZip(zipPath);
      
      // Get file size
      const stats = await fs.stat(zipPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
      
      console.log('✅ ZIP package created successfully!');
      console.log(`📁 File: ${zipPath}`);
      console.log(`📊 Size: ${fileSizeMB} MB`);
      console.log('');
      console.log('🚀 Ready for distribution!');
      console.log('');
      console.log('📋 Distribution checklist:');
      console.log('  ✓ ZIP file created');
      console.log('  ✓ User documentation included');
      console.log('  ✓ Sample datasets included');
      console.log('  ✓ Launcher scripts included');
      console.log('  ✅ PHP included (portable PHP 8.3)');
      console.log('');
      console.log('🌐 Upload to GitHub releases:');
      console.log(`  - Tag: v${this.packageJson.version}-desktop`);
      console.log(`  - Asset: ${zipFileName}`);
      
      return zipPath;
      
    } catch (error) {
      console.error('❌ Failed to create ZIP package:', error.message);
      throw error;
    }
  }

  generateZipFileName() {
    const version = this.packageJson.version;
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `articy-desktop-viewer-v${version}-${timestamp}.zip`;
  }

  async addDirectoryToZip(zip, sourceDir, zipDir = '') {
    const items = await fs.readdir(sourceDir);
    
    for (const item of items) {
      const sourcePath = path.join(sourceDir, item);
      const zipPath = zipDir ? path.join(zipDir, item) : item;
      const stats = await fs.stat(sourcePath);
      
      if (stats.isDirectory()) {
        // Recursively add directory
        await this.addDirectoryToZip(zip, sourcePath, zipPath);
      } else {
        // Add file
        const fileContent = await fs.readFile(sourcePath);
        zip.addFile(zipPath, fileContent);
      }
    }
  }

  async validatePackage() {
    console.log('🔍 Validating desktop package...');
    
    const requiredFiles = [
      'start-articy.bat',
      'stop-articy.bat',
      'README.txt',
      'app/index.html',
      'app/datasets.php',
      'php/php.ini',
      'php/php.exe',
      'datasets',
      'logs'
    ];
    
    const missingFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.packageDir, file);
      if (!await fs.pathExists(filePath)) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length > 0) {
      console.error('❌ Package validation failed. Missing files:');
      missingFiles.forEach(file => console.error(`  - ${file}`));
      throw new Error('Package validation failed');
    }
    
    console.log('✅ Package validation passed');
  }

  async getPackageInfo() {
    if (!await fs.pathExists(this.packageDir)) {
      throw new Error('Desktop package not found');
    }
    
    // Calculate total size
    const calculateSize = async (dir) => {
      let totalSize = 0;
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += await calculateSize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    };
    
    const totalSize = await calculateSize(this.packageDir);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
    
    // Count files
    const countFiles = async (dir) => {
      let fileCount = 0;
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          fileCount += await countFiles(itemPath);
        } else {
          fileCount++;
        }
      }
      
      return fileCount;
    };
    
    const fileCount = await countFiles(this.packageDir);
    
    return {
      totalSize: totalSizeMB,
      fileCount,
      version: this.packageJson.version
    };
  }
}

// Main execution
async function main() {
  const zipper = new DesktopPackageZipper();

  // Validate package first
  await zipper.validatePackage();

  // Show package info
  const info = await zipper.getPackageInfo();
  console.log('📊 Package Information:');
  console.log(`  Version: ${info.version}`);
  console.log(`  Total Size: ${info.totalSize} MB`);
  console.log(`  File Count: ${info.fileCount}`);
  console.log('');

  // Create ZIP
  await zipper.createZipPackage();
}

// Always run when executed directly
main().catch(console.error);

export { DesktopPackageZipper };
