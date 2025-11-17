/**
 * Port (interface) for Unit caching operations
 * This is part of the Domain layer and defines the contract for caching
 *
 * Following Clean Architecture:
 * - Domain defines the interface (port)
 * - Infrastructure implements the adapter (Redis, Memcached, etc.)
 * - Application layer (use cases) depends on the port, not the implementation
 */
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
