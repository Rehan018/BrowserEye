export interface TabContext {
  tabId: number;
  url: string;
  title: string;
  sessionId?: string;
  lastActivity: Date;
}

export class CrossTabManager {
  private tabContexts: Map<number, TabContext> = new Map();
  private contextListeners: ((contexts: TabContext[]) => void)[] = [];

  constructor() {
    this.initializeTabTracking();
  }

  private initializeTabTracking(): void {
    // Track tab activation
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      await this.updateTabContext(activeInfo.tabId);
    });

    // Track tab updates
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        await this.updateTabContext(tabId, tab.url, tab.title);
      }
    });

    // Clean up closed tabs
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.tabContexts.delete(tabId);
      this.notifyContextListeners();
    });
  }

  private async updateTabContext(tabId: number, url?: string, title?: string): Promise<void> {
    try {
      const tab = await chrome.tabs.get(tabId);
      
      const context: TabContext = {
        tabId,
        url: url || tab.url || '',
        title: title || tab.title || '',
        lastActivity: new Date()
      };

      this.tabContexts.set(tabId, context);
      this.notifyContextListeners();
    } catch (error) {
      // Tab might be closed or inaccessible
      this.tabContexts.delete(tabId);
    }
  }

  async associateSessionWithTab(tabId: number, sessionId: string): Promise<void> {
    const context = this.tabContexts.get(tabId);
    if (context) {
      context.sessionId = sessionId;
      this.tabContexts.set(tabId, context);
      this.notifyContextListeners();
    }
  }

  getTabContext(tabId: number): TabContext | undefined {
    return this.tabContexts.get(tabId);
  }

  getAllTabContexts(): TabContext[] {
    return Array.from(this.tabContexts.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  getTabsWithSessions(): TabContext[] {
    return this.getAllTabContexts().filter(context => context.sessionId);
  }

  async switchToTabWithSession(sessionId: string): Promise<boolean> {
    const tabContext = Array.from(this.tabContexts.values())
      .find(context => context.sessionId === sessionId);
    
    if (tabContext) {
      await chrome.tabs.update(tabContext.tabId, { active: true });
      return true;
    }
    
    return false;
  }

  onContextChange(listener: (contexts: TabContext[]) => void): void {
    this.contextListeners.push(listener);
  }

  private notifyContextListeners(): void {
    const contexts = this.getAllTabContexts();
    this.contextListeners.forEach(listener => listener(contexts));
  }
}