/**
 * Health check service interface
 * Defines the contract for health check operations
 */
export interface IHealthService {
  /**
   * Check PostgreSQL database health
   * @returns Promise<boolean> indicating database health
   */
  checkDatabase(): Promise<boolean>;

  /**
   * Get readiness check result
   * Checks if all critical services are ready
   * @returns Promise with readiness status and checks
   */
  getReadinessCheck(): Promise<{
    status: string;
    timestamp: string;
    checks: {
      postgres: boolean;
      redis: boolean;
    };
  }>;
}

export const HEALTH_SERVICE_TOKEN_CONSTANT = 'IHealthService';
