export interface PageData {
  url: string;
  title: string;
  content: string;
  timestamp: Date;
  analysis?: string;
}

export class PageWatcher {
  private currentPageData: PageData | null = null;
  private analysisCache = new Map<string, string>();

  constructor() {
    this.setupTabListener();
  }

  private setupTabListener(): void {
    chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && tab.title) {
        await this.analyzeNewPage(tab.url, tab.title);
      }
    });

    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url && tab.title) {
        await this.analyzeNewPage(tab.url, tab.title);
      }
    });
  }

  private async analyzeNewPage(url: string, title: string): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) return;

      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'GET_PAGE_CONTENT_FOR_ANALYSIS'
      }, async (response) => {
        if (response?.success && response.content) {
          const pageData: PageData = {
            url,
            title,
            content: response.content,
            timestamp: new Date()
          };

          const cacheKey = this.getCacheKey(url, response.content);
          if (this.analysisCache.has(cacheKey)) {
            pageData.analysis = this.analysisCache.get(cacheKey);
            this.currentPageData = pageData;
            return;
          }

          const analysis = await this.analyzePageContent(response.content, url);
          if (analysis) {
            pageData.analysis = analysis;
            this.analysisCache.set(cacheKey, analysis);
          }

          this.currentPageData = pageData;
        }
      });
    } catch (error) {
      console.error('Page analysis failed:', error);
    }
  }

  private async analyzePageContent(content: string, url: string): Promise<string | null> {
    try {
      const settings = await chrome.storage.sync.get(['selectedProvider', 'model', 'apiKeys']);
      if (!settings.selectedProvider || !settings.apiKeys?.[settings.selectedProvider]) {
        return null;
      }

      const prompt = `Analyze this webpage briefly:

URL: ${url}
Content: ${content.substring(0, 3000)}

Provide a concise summary covering main topic, key information, and important details. Keep under 150 words.`;

      // Use existing streamLlm service
      const { streamLlm } = await import('../../services/llm');
      const stream = streamLlm([{ role: 'user', content: prompt }], {
        provider: settings.selectedProvider,
        model: settings.model,
        apiKey: settings.apiKeys[settings.selectedProvider]
      });

      const reader = stream.getReader();
      let result = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += value;
      }

      return result.trim();
    } catch (error) {
      console.error('Analysis failed:', error);
      return null;
    }
  }

  private getCacheKey(url: string, content: string): string {
    return `${url}_${content.length}`;
  }

  getCurrentPageData(): PageData | null {
    return this.currentPageData;
  }

  getPageAnalysis(): string | null {
    return this.currentPageData?.analysis || null;
  }
}