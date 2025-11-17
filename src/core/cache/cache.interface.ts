/**
 * Cache service interface
 * Defines the contract for cache operations
 */
export interface ICacheService {
  /**
   * Clear all cache entries
   * @returns Promise with operation result
   */
  clearAll(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }>;

  /**
   * Get cache statistics
   * @returns Promise with cache stats or error
   */
  getStats(): Promise<{
    connected: boolean;
    uptime?: string;
    total_commands_processed?: string;
    total_connections_received?: string;
    used_memory?: string;
    used_memory_peak?: string;
    keyspace?: string;
    timestamp: string;
    error?: string;
  }>;

  /**
   * Check if cache is healthy
   * @returns Promise<boolean> indicating cache health
   */
  isHealthy(): Promise<boolean>;
}

export const CACHE_SERVICE_TOKEN_CONSTANT = 'ICacheService';
