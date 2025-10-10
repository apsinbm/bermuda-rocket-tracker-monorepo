/**
 * Telemetry Service
 *
 * Tracks data quality issues, API failures, and incomplete launch data
 * to help identify patterns and improve system reliability.
 */

export interface TelemetryEvent {
  timestamp: string;
  category: 'data_quality' | 'api_error' | 'visibility_calculation' | 'performance';
  severity: 'info' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, any>;
}

export interface DataQualityIssue {
  launchId: string;
  launchName: string;
  missingFields: string[];
  timestamp: string;
}

export class TelemetryService {
  private static events: TelemetryEvent[] = [];
  private static dataQualityIssues: Map<string, DataQualityIssue> = new Map();
  private static readonly MAX_EVENTS = 1000; // Keep last 1000 events in memory

  /**
   * Log a telemetry event
   */
  static logEvent(
    category: TelemetryEvent['category'],
    severity: TelemetryEvent['severity'],
    message: string,
    metadata?: Record<string, any>
  ): void {
    const event: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      category,
      severity,
      message,
      metadata,
    };

    // Log to console in development
    const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
    if (isDev) {
      const emoji = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`[Telemetry ${category}] ${emoji} ${message}`, metadata || '');
    }

    // Add to events array
    this.events.push(event);

    // Keep only last MAX_EVENTS
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }

  /**
   * Track data quality issue for a launch
   */
  static trackDataQualityIssue(launchId: string, launchName: string, missingFields: string[]): void {
    const issue: DataQualityIssue = {
      launchId,
      launchName,
      missingFields,
      timestamp: new Date().toISOString(),
    };

    this.dataQualityIssues.set(launchId, issue);

    this.logEvent(
      'data_quality',
      'warning',
      `Incomplete data for launch: ${launchName}`,
      {
        launchId,
        missingFields,
      }
    );
  }

  /**
   * Track API error
   */
  static trackApiError(
    service: string,
    endpoint: string,
    error: Error | string,
    metadata?: Record<string, any>
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.logEvent(
      'api_error',
      'error',
      `${service} API error on ${endpoint}: ${errorMessage}`,
      {
        service,
        endpoint,
        error: errorMessage,
        ...metadata,
      }
    );
  }

  /**
   * Track visibility calculation failure
   */
  static trackVisibilityCalculationFailure(
    launchId: string,
    launchName: string,
    error: Error | string,
    fallbackUsed: boolean
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.logEvent(
      'visibility_calculation',
      fallbackUsed ? 'warning' : 'error',
      `Visibility calculation failed for ${launchName}`,
      {
        launchId,
        error: errorMessage,
        fallbackUsed,
      }
    );
  }

  /**
   * Track performance metric
   */
  static trackPerformance(operation: string, durationMs: number, metadata?: Record<string, any>): void {
    const severity: TelemetryEvent['severity'] = durationMs > 5000 ? 'warning' : 'info';

    this.logEvent('performance', severity, `${operation} completed in ${durationMs}ms`, {
      operation,
      durationMs,
      ...metadata,
    });
  }

  /**
   * Get all telemetry events
   */
  static getEvents(filter?: {
    category?: TelemetryEvent['category'];
    severity?: TelemetryEvent['severity'];
    since?: Date;
  }): TelemetryEvent[] {
    let filtered = [...this.events];

    if (filter) {
      if (filter.category) {
        filtered = filtered.filter((e) => e.category === filter.category);
      }
      if (filter.severity) {
        filtered = filtered.filter((e) => e.severity === filter.severity);
      }
      if (filter.since) {
        const sinceTime = filter.since.getTime();
        filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= sinceTime);
      }
    }

    return filtered;
  }

  /**
   * Get data quality issues
   */
  static getDataQualityIssues(): DataQualityIssue[] {
    return Array.from(this.dataQualityIssues.values());
  }

  /**
   * Get data quality summary
   */
  static getDataQualitySummary(): {
    totalLaunches: number;
    launchesWithIssues: number;
    commonMissingFields: { field: string; count: number }[];
  } {
    const issues = this.getDataQualityIssues();
    const fieldCounts: Map<string, number> = new Map();

    issues.forEach((issue) => {
      issue.missingFields.forEach((field) => {
        fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
      });
    });

    const commonMissingFields = Array.from(fieldCounts.entries())
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most common missing fields

    return {
      totalLaunches: issues.length,
      launchesWithIssues: issues.length,
      commonMissingFields,
    };
  }

  /**
   * Get error summary
   */
  static getErrorSummary(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    recentErrors: TelemetryEvent[];
  } {
    const errors = this.getEvents({ severity: 'error' });
    const errorsByCategory: Record<string, number> = {};

    errors.forEach((event) => {
      errorsByCategory[event.category] = (errorsByCategory[event.category] || 0) + 1;
    });

    return {
      totalErrors: errors.length,
      errorsByCategory,
      recentErrors: errors.slice(-10), // Last 10 errors
    };
  }

  /**
   * Clear all telemetry data
   */
  static clear(): void {
    this.events = [];
    this.dataQualityIssues.clear();
    console.log('[Telemetry] All telemetry data cleared');
  }

  /**
   * Export telemetry data for analysis
   */
  static exportData(): {
    events: TelemetryEvent[];
    dataQualityIssues: DataQualityIssue[];
    summary: {
      dataQuality: ReturnType<typeof TelemetryService.getDataQualitySummary>;
      errors: ReturnType<typeof TelemetryService.getErrorSummary>;
    };
  } {
    return {
      events: this.getEvents(),
      dataQualityIssues: this.getDataQualityIssues(),
      summary: {
        dataQuality: this.getDataQualitySummary(),
        errors: this.getErrorSummary(),
      },
    };
  }
}

// Export singleton instance
export const telemetryService = TelemetryService;
