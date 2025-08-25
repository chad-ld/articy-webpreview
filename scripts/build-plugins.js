/**
 * Plugin Build Script
 * Compiles plugins separately from the main application
 * Generates plugin manifest for dynamic loading
 */

import fs from 'fs-extra';
import path from 'path';
import { build } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PluginBuilder {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.pluginsSourceDir = path.join(this.projectRoot, 'src', 'plugins');
    this.pluginsOutputDir = path.join(this.projectRoot, 'dist', 'plugins');
    this.tempBuildDir = path.join(this.projectRoot, '.plugin-build-temp');
  }

  /**
   * Build all plugins separately
   */
  async buildPlugins() {
    console.log('🔌 Starting plugin build process...');

    try {
      // 1. Discover available plugins
      const plugins = await this.discoverPlugins();
      
      if (plugins.length === 0) {
        console.log('📝 No plugins found to build');
        return;
      }

      console.log(`📁 Found ${plugins.length} plugins to build:`, plugins.map(p => p.name));

      // 2. Ensure output directory exists
      await fs.ensureDir(this.pluginsOutputDir);

      // 3. Build each plugin separately
      const builtPlugins = [];
      for (const plugin of plugins) {
        try {
          const builtPlugin = await this.buildSinglePlugin(plugin);
          if (builtPlugin) {
            builtPlugins.push(builtPlugin);
          }
        } catch (error) {
          console.error(`❌ Failed to build plugin ${plugin.name}:`, error.message);
        }
      }

      // 4. Generate plugin manifest
      await this.generatePluginManifest(builtPlugins);

      // 5. Cleanup temp directory
      await fs.remove(this.tempBuildDir);

      console.log(`✅ Plugin build complete: ${builtPlugins.length} plugins built successfully`);

    } catch (error) {
      console.error('❌ Plugin build failed:', error);
      throw error;
    }
  }

  /**
   * Discover all available plugins in the source directory
   */
  async discoverPlugins() {
    const plugins = [];
    
    try {
      const pluginDirs = await fs.readdir(this.pluginsSourceDir);
      
      for (const dirName of pluginDirs) {
        const pluginDir = path.join(this.pluginsSourceDir, dirName);
        const indexFile = path.join(pluginDir, 'index.ts');
        
        // Skip files and directories without index.ts
        if (!(await fs.pathExists(indexFile))) {
          continue;
        }

        // Skip system files
        if (dirName.endsWith('.ts') || dirName.startsWith('.')) {
          continue;
        }

        plugins.push({
          id: dirName,
          name: dirName,
          sourceDir: pluginDir,
          entryFile: indexFile
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to discover plugins:', error);
    }

    return plugins;
  }

  /**
   * Build a single plugin as a separate module
   */
  async buildSinglePlugin(plugin) {
    console.log(`🔨 Building plugin: ${plugin.name}`);

    try {
      // Create temporary build directory for this plugin
      const tempPluginDir = path.join(this.tempBuildDir, plugin.id);
      await fs.ensureDir(tempPluginDir);

      // Copy plugin source to temp directory
      await fs.copy(plugin.sourceDir, tempPluginDir);

      // Create a temporary package.json for the plugin
      const tempPackageJson = {
        name: `plugin-${plugin.id}`,
        type: 'module',
        main: 'index.ts'
      };
      await fs.writeJson(path.join(tempPluginDir, 'package.json'), tempPackageJson);

      // Build the plugin using Vite
      const outputFile = `${plugin.id}.js`;
      const outputPath = path.join(this.pluginsOutputDir, outputFile);

      await build({
        root: tempPluginDir,
        build: {
          outDir: this.pluginsOutputDir,
          lib: {
            entry: 'index.ts',
            name: plugin.id,
            fileName: () => outputFile,
            formats: ['es']
          },
          rollupOptions: {
            external: ['react', 'react-dom', 'antd', 'lodash'],
            output: {
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                antd: 'antd',
                lodash: '_'
              }
            }
          },
          sourcemap: true,
          minify: false // Keep readable for debugging
        },
        esbuild: {
          jsx: 'automatic'
        }
      });

      // Verify the output file was created
      if (await fs.pathExists(outputPath)) {
        console.log(`✅ Successfully built plugin: ${plugin.name} → ${outputFile}`);
        
        // Try to extract metadata from the built plugin
        const metadata = await this.extractPluginMetadata(plugin);
        
        return {
          id: plugin.id,
          name: metadata?.name || plugin.name,
          file: outputFile,
          version: metadata?.version || '1.0.0',
          description: metadata?.description || '',
          author: metadata?.author || ''
        };
      } else {
        throw new Error(`Output file not created: ${outputPath}`);
      }

    } catch (error) {
      console.error(`❌ Failed to build plugin ${plugin.name}:`, error);
      return null;
    }
  }

  /**
   * Extract metadata from plugin source
   */
  async extractPluginMetadata(plugin) {
    try {
      // Read the plugin index file to extract metadata
      const indexContent = await fs.readFile(plugin.entryFile, 'utf8');
      
      // Simple regex-based extraction (could be improved with AST parsing)
      const metadata = {};
      
      // Look for metadata in comments or exports
      const nameMatch = indexContent.match(/name:\s*['"`]([^'"`]+)['"`]/);
      if (nameMatch) metadata.name = nameMatch[1];
      
      const versionMatch = indexContent.match(/version:\s*['"`]([^'"`]+)['"`]/);
      if (versionMatch) metadata.version = versionMatch[1];
      
      const descriptionMatch = indexContent.match(/description:\s*['"`]([^'"`]+)['"`]/);
      if (descriptionMatch) metadata.description = descriptionMatch[1];
      
      const authorMatch = indexContent.match(/author:\s*['"`]([^'"`]+)['"`]/);
      if (authorMatch) metadata.author = authorMatch[1];
      
      return metadata;
      
    } catch (error) {
      console.warn(`⚠️ Could not extract metadata from ${plugin.name}:`, error.message);
      return {};
    }
  }

  /**
   * Generate plugin manifest file
   */
  async generatePluginManifest(builtPlugins) {
    const manifest = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      available: builtPlugins
    };

    const manifestPath = path.join(this.pluginsOutputDir, 'plugins.json');
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    
    console.log(`📋 Generated plugin manifest: ${manifestPath}`);
    console.log(`📝 Manifest contains ${builtPlugins.length} plugins`);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting plugin build script...');
  try {
    const builder = new PluginBuilder();
    await builder.buildPlugins();
    console.log('🎉 Plugin build script completed successfully!');
  } catch (error) {
    console.error('❌ Plugin build script failed:', error);
    process.exit(1);
  }
}

// Always run when executed directly
main().catch((error) => {
  console.error('💥 Unhandled error in plugin build script:', error);
  process.exit(1);
});

export { PluginBuilder };
