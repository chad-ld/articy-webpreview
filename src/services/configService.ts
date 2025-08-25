/**
 * Configuration Service
 * Handles loading and validation of application configuration
 */

export interface AppConfig {
  version: string;
  description?: string;
  plugins: {
    defaultEnabled: string[];
  };
  future?: {
    datasets?: {
      autoLoad?: string | null;
      skipLoadingScreen?: boolean;
    };
    ui?: {
      storyMode?: boolean;
      variablesPanel?: boolean;
      searchPanel?: boolean;
    };
    advanced?: {
      debugging?: {
        enableConsoleLogging?: boolean;
        logLevel?: 'error' | 'warn' | 'info' | 'debug';
      };
    };
  };
}

class ConfigService {
  private config: AppConfig | null = null;
  private loaded = false;

  /**
   * Load configuration from config.json
   */
  async loadConfig(): Promise<AppConfig> {
    if (this.loaded && this.config) {
      return this.config;
    }

    try {
      console.log('🔧 Loading application configuration...');
      
      // Add cache-busting parameter to prevent stale config
      const timestamp = new Date().getTime();
      const response = await fetch(`./config.json?v=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
      }

      const configData = await response.json();
      
      // Validate configuration
      this.validateConfig(configData);
      
      this.config = configData;
      this.loaded = true;
      
      console.log('✅ Configuration loaded successfully:', {
        version: this.config.version,
        defaultPlugins: this.config.plugins.defaultEnabled
      });
      
      return this.config;
      
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      
      // Return fallback configuration
      const fallbackConfig: AppConfig = {
        version: '1.0.0-fallback',
        plugins: {
          defaultEnabled: []
        }
      };
      
      console.log('🔄 Using fallback configuration');
      this.config = fallbackConfig;
      this.loaded = true;
      
      return fallbackConfig;
    }
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(config: any): void {
    if (!config || typeof config !== 'object') {
      throw new Error('Configuration must be a valid JSON object');
    }

    if (!config.version || typeof config.version !== 'string') {
      throw new Error('Configuration must have a valid version string');
    }

    if (!config.plugins || typeof config.plugins !== 'object') {
      throw new Error('Configuration must have a plugins section');
    }

    if (!Array.isArray(config.plugins.defaultEnabled)) {
      throw new Error('plugins.defaultEnabled must be an array');
    }

    // Validate plugin IDs are strings
    for (const pluginId of config.plugins.defaultEnabled) {
      if (typeof pluginId !== 'string') {
        throw new Error(`Invalid plugin ID: ${pluginId} (must be string)`);
      }
    }

    console.log('✅ Configuration validation passed');
  }

  /**
   * Get default enabled plugins from config
   */
  getDefaultEnabledPlugins(): string[] {
    if (!this.config) {
      console.warn('⚠️ Configuration not loaded, returning empty array');
      return [];
    }

    return this.config.plugins.defaultEnabled || [];
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig | null {
    return this.config;
  }

  /**
   * Check if configuration is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }
}

// Global configuration service instance
export const configService = new ConfigService();

export default ConfigService;
