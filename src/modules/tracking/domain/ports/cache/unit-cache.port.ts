export interface IUnitCachePort {
  /**
   * Gets unit existence from cache
   * @param trackingId - The tracking ID of the unit
   * @returns '1' if exists, '0' if not exists, null if not cached
   */
  getUnitExists(trackingId: string): Promise<string | null>;

  /**
   * Sets unit existence in cache
   * @param trackingId - The tracking ID of the unit
   * @param exists - true if unit exists, false if not
   */
  setUnitExists(trackingId: string, exists: boolean): Promise<void>;

  /**
   * Invalidates cache for a specific tracking ID
   * Used when a unit is created or updated
   * @param trackingId - The tracking ID of the unit
   */
  invalidateUnit(trackingId: string): Promise<void>;

  /**
   * Clears all tracking cache
   * Use with caution - mainly for testing/maintenance
   */
  clearAll(): Promise<void>;
}

/**
 * Token for dependency injection
 */
export const UNIT_CACHE_PORT_TOKEN = 'IUnitCachePort';
