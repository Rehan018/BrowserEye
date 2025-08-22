export interface PrivacySettings {
  dataRetentionDays: number;
  encryptSensitiveData: boolean;
  shareAnalytics: boolean;
  logUserActions: boolean;
  autoDeleteOldData: boolean;
  allowDataExport: boolean;
  requireConfirmation: boolean;
}

export interface DataCategory {
  id: string;
  name: string;
  description: string;
  sensitive: boolean;
  retentionDays: number;
  encrypted: boolean;
}

export class PrivacyManager {
  private static readonly SETTINGS_KEY = 'browsereye_privacy_settings';
  private static readonly DATA_CATEGORIES_KEY = 'browsereye_data_categories';

  private defaultSettings: PrivacySettings = {
    dataRetentionDays: 30,
    encryptSensitiveData: true,
    shareAnalytics: false,
    logUserActions: true,
    autoDeleteOldData: true,
    allowDataExport: true,
    requireConfirmation: true
  };

  private defaultCategories: DataCategory[] = [
    {
      id: 'conversations',
      name: 'Chat Conversations',
      description: 'Your chat history and messages',
      sensitive: true,
      retentionDays: 30,
      encrypted: true
    },
    {
      id: 'page_analysis',
      name: 'Page Analysis Data',
      description: 'Analyzed content from visited pages',
      sensitive: false,
      retentionDays: 7,
      encrypted: false
    },
    {
      id: 'usage_analytics',
      name: 'Usage Analytics',
      description: 'How you use the extension features',
      sensitive: false,
      retentionDays: 90,
      encrypted: false
    },
    {
      id: 'api_keys',
      name: 'API Keys',
      description: 'Your AI provider API keys',
      sensitive: true,
      retentionDays: -1, // Never auto-delete
      encrypted: true
    }
  ];

  async getSettings(): Promise<PrivacySettings> {
    try {
      const result = await chrome.storage.sync.get([PrivacyManager.SETTINGS_KEY]);
      return { ...this.defaultSettings, ...result[PrivacyManager.SETTINGS_KEY] };
    } catch (error) {
      console.error('Failed to get privacy settings:', error);
      return this.defaultSettings;
    }
  }

  async updateSettings(settings: Partial<PrivacySettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      
      await chrome.storage.sync.set({
        [PrivacyManager.SETTINGS_KEY]: updated
      });
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    }
  }

  async getDataCategories(): Promise<DataCategory[]> {
    try {
      const result = await chrome.storage.local.get([PrivacyManager.DATA_CATEGORIES_KEY]);
      return result[PrivacyManager.DATA_CATEGORIES_KEY] || this.defaultCategories;
    } catch (error) {
      console.error('Failed to get data categories:', error);
      return this.defaultCategories;
    }
  }

  async updateDataCategory(categoryId: string, updates: Partial<DataCategory>): Promise<void> {
    try {
      const categories = await this.getDataCategories();
      const index = categories.findIndex(c => c.id === categoryId);
      
      if (index !== -1) {
        categories[index] = { ...categories[index], ...updates };
        await chrome.storage.local.set({
          [PrivacyManager.DATA_CATEGORIES_KEY]: categories
        });
      }
    } catch (error) {
      console.error('Failed to update data category:', error);
    }
  }

  async deleteDataByCategory(categoryId: string): Promise<void> {
    try {
      const category = (await this.getDataCategories()).find(c => c.id === categoryId);
      if (!category) return;

      // Delete based on category
      switch (categoryId) {
        case 'conversations':
          await chrome.storage.local.remove(['conversations']);
          break;
        case 'page_analysis':
          await chrome.storage.local.remove(['page_analysis_cache']);
          break;
        case 'usage_analytics':
          await chrome.storage.local.remove(['browsereye_usage_stats']);
          break;
        case 'api_keys':
          await chrome.storage.sync.remove(['apiKeys']);
          break;
      }
    } catch (error) {
      console.error('Failed to delete data by category:', error);
    }
  }

  async cleanupOldData(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.autoDeleteOldData) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.dataRetentionDays);

    try {
      // Clean up conversations
      const conversations = await chrome.storage.local.get(['conversations']);
      if (conversations.conversations) {
        const filtered = Object.fromEntries(
          Object.entries(conversations.conversations).filter(([_, conv]: [string, any]) => 
            new Date(conv.createdAt) > cutoffDate
          )
        );
        await chrome.storage.local.set({ conversations: filtered });
      }

      // Clean up audit logs
      const auditLogs = await chrome.storage.local.get(['browsereye_audit_log']);
      if (auditLogs.browsereye_audit_log) {
        const filtered = auditLogs.browsereye_audit_log.filter((log: any) => 
          new Date(log.timestamp) > cutoffDate
        );
        await chrome.storage.local.set({ browsereye_audit_log: filtered });
      }
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  async exportAllData(): Promise<string> {
    const settings = await this.getSettings();
    if (!settings.allowDataExport) {
      throw new Error('Data export is disabled in privacy settings');
    }

    try {
      const allData = await chrome.storage.local.get(null);
      const syncData = await chrome.storage.sync.get(null);
      
      return JSON.stringify({
        local: allData,
        sync: syncData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async deleteAllData(): Promise<void> {
    const settings = await this.getSettings();
    if (settings.requireConfirmation) {
      throw new Error('Confirmation required for data deletion');
    }

    try {
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();
    } catch (error) {
      console.error('Failed to delete all data:', error);
      throw error;
    }
  }
}