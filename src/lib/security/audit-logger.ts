export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: 'user_action' | 'data_access' | 'settings_change' | 'security_event';
  action: string;
  details: Record<string, any>;
  userId?: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private static readonly STORAGE_KEY = 'browsereye_audit_log';
  private static readonly MAX_ENTRIES = 1000;
  private sessionId: string;

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  async logEvent(
    type: AuditEvent['type'],
    action: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      action,
      details,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent
    };

    try {
      const logs = await this.getLogs();
      logs.push(event);
      
      // Keep only recent entries
      if (logs.length > AuditLogger.MAX_ENTRIES) {
        logs.splice(0, logs.length - AuditLogger.MAX_ENTRIES);
      }

      await chrome.storage.local.set({
        [AuditLogger.STORAGE_KEY]: logs
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  async getLogs(filter?: {
    type?: AuditEvent['type'];
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditEvent[]> {
    try {
      const result = await chrome.storage.local.get([AuditLogger.STORAGE_KEY]);
      let logs: AuditEvent[] = result[AuditLogger.STORAGE_KEY] || [];
      
      // Convert timestamp strings back to Date objects
      logs = logs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));

      if (filter) {
        logs = logs.filter(log => {
          if (filter.type && log.type !== filter.type) return false;
          if (filter.action && log.action !== filter.action) return false;
          if (filter.startDate && log.timestamp < filter.startDate) return false;
          if (filter.endDate && log.timestamp > filter.endDate) return false;
          return true;
        });
      }

      return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      await chrome.storage.local.remove([AuditLogger.STORAGE_KEY]);
    } catch (error) {
      console.error('Failed to clear audit logs:', error);
    }
  }

  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  // Convenience methods for common events
  async logUserAction(action: string, details: Record<string, any> = {}): Promise<void> {
    await this.logEvent('user_action', action, details);
  }

  async logDataAccess(action: string, details: Record<string, any> = {}): Promise<void> {
    await this.logEvent('data_access', action, details);
  }

  async logSettingsChange(action: string, details: Record<string, any> = {}): Promise<void> {
    await this.logEvent('settings_change', action, details);
  }

  async logSecurityEvent(action: string, details: Record<string, any> = {}): Promise<void> {
    await this.logEvent('security_event', action, details);
  }
}