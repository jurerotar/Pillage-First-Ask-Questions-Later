import i18n from 'i18next';

/**
 * Provides fallback mechanism for when hashed keys don't resolve to values
 * This handles the case where a hashed key might not be found in the localization files
 */
export class I18nFallbackHandler {
  private static instance: I18nFallbackHandler;
  private keyMappings: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): I18nFallbackHandler {
    if (!I18nFallbackHandler.instance) {
      I18nFallbackHandler.instance = new I18nFallbackHandler();
    }
    return I18nFallbackHandler.instance;
  }

  /**
   * Initialize the fallback handler with key mappings
   * @param mappings - A map of hashed keys to their original keys
   */
  public initializeMappings(mappings: Record<string, string>): void {
    this.keyMappings = new Map(Object.entries(mappings));
  }

  /**
   * Try to find a fallback value for a given key
   * @param key - The key that failed to resolve
   * @param defaultValue - The default value to return if no fallback is found
   * @returns The fallback value if found, otherwise the default value
   */
  public getFallbackValue(key: string, defaultValue: string): string {
    // First, try to find the original key from the hash
    const originalKey = this.keyMappings.get(key);
    if (originalKey) {
      // If we found the original key, try to translate it
      const translatedValue = i18n.t(originalKey);
      if (translatedValue && translatedValue !== originalKey) {
        return translatedValue;
      }
    }

    // If no mapping exists or the original key doesn't translate, return the default
    return defaultValue;
  }

  /**
   * Register a custom fallback handler with i18next
   * This ensures that if a key isn't found, we can try the original key
   */
  public registerFallbackHandler(): void {
    // This adds a middleware-like functionality to intercept missing keys
    const originalT = i18n.t.bind(i18n);

    // Override the t function to add fallback logic
    // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed to override i18n.t with fallback logic
    (i18n as any).t = (key: string, options?: any) => {
      let result = originalT(key, options);

      // If the result is the same as the key (indicating it wasn't found), try fallback
      if (result === key) {
        result = this.getFallbackValue(key, key);
      }

      // If options were passed, apply interpolation
      if (options && typeof result === 'string') {
        // Apply interpolation if options contain interpolation variables
        for (const [optionKey, optionValue] of Object.entries(options)) {
          if (typeof optionValue !== 'object' && optionValue !== null) {
            const placeholder = new RegExp(`{{${optionKey}}}`, 'g');
            result = result.replace(placeholder, String(optionValue));
          }
        }
      }

      return result;
    };
  }
}

// Export singleton instance
export const i18nFallbackHandler = I18nFallbackHandler.getInstance();
