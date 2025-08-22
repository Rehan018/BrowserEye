export interface UsageEvent {
  type: 'command' | 'view_change' | 'feature_use' | 'error' | 'session';
  action: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UsageStats {
  totalSessions: number;
  totalCommands: number;
  mostUsedFeatures: Array<{ feature: string; count: number }>;
  averageSessionDuration: number;
  lastUsed: Date;
  dailyUsage: Array<{ date: string; count: number }>;
}

export class UsageTracker {
  private events: UsageEvent[] = [];
  private sessionStart: Date | null = null;
  private readonly STORAGE_KEY = 'browsereye_usage_stats';

  constructor() {
    this.loadEvents();
    this.startSession();
  }

  private async loadEvents(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      if (result[this.STORAGE_KEY]) {
        this.events = result[this.STORAGE_KEY].map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load usage events:', error);
    }
  }

  private async saveEvents(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: this.events
      });
    } catch (error) {
      console.error('Failed to save usage events:', error);
    }
  }

  trackEvent(type: UsageEvent['type'], action: string, metadata?: Record<string, any>): void {
    const event: UsageEvent = {
      type,
      action,
      timestamp: new Date(),
      metadata
    };

    this.events.push(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    this.saveEvents();
  }

  startSession(): void {
    this.sessionStart = new Date();
    this.trackEvent('session', 'start');
  }

  endSession(): void {
    if (this.sessionStart) {
      const duration = Date.now() - this.sessionStart.getTime();
      this.trackEvent('session', 'end', { duration });
      this.sessionStart = null;
    }
  }

  getUsageStats(): UsageStats {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter recent events
    const recentEvents = this.events.filter(e => e.timestamp >= thirtyDaysAgo);
    
    // Calculate sessions
    const sessionEvents = recentEvents.filter(e => e.type === 'session');
    const sessionStarts = sessionEvents.filter(e => e.action === 'start');
    const sessionEnds = sessionEvents.filter(e => e.action === 'end');
    
    // Calculate average session duration
    const durations = sessionEnds
      .filter(e => e.metadata?.duration)
      .map(e => e.metadata!.duration as number);
    const averageSessionDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    // Most used features
    const featureUsage = new Map<string, number>();
    recentEvents.forEach(event => {
      if (event.type !== 'session') {
        const key = `${event.type}:${event.action}`;
        featureUsage.set(key, (featureUsage.get(key) || 0) + 1);
      }
    });

    const mostUsedFeatures = Array.from(featureUsage.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily usage
    const dailyUsage = this.getDailyUsage(recentEvents);

    return {
      totalSessions: sessionStarts.length,
      totalCommands: recentEvents.filter(e => e.type === 'command').length,
      mostUsedFeatures,
      averageSessionDuration: Math.round(averageSessionDuration / 1000), // Convert to seconds
      lastUsed: recentEvents.length > 0 ? recentEvents[recentEvents.length - 1].timestamp : new Date(),
      dailyUsage
    };
  }

  private getDailyUsage(events: UsageEvent[]): Array<{ date: string; count: number }> {
    const dailyCount = new Map<string, number>();
    
    events.forEach(event => {
      const date = event.timestamp.toISOString().split('T')[0];
      dailyCount.set(date, (dailyCount.get(date) || 0) + 1);
    });

    // Get last 7 days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: dailyCount.get(dateStr) || 0
      });
    }

    return result;
  }

  getTopCommands(limit: number = 5): Array<{ command: string; count: number }> {
    const commandCounts = new Map<string, number>();
    
    this.events
      .filter(e => e.type === 'command')
      .forEach(e => {
        commandCounts.set(e.action, (commandCounts.get(e.action) || 0) + 1);
      });

    return Array.from(commandCounts.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  clearData(): void {
    this.events = [];
    this.saveEvents();
  }
}