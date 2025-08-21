export interface SearchQuery {
  query: string;
  timestamp: Date;
  source: 'google' | 'bing' | 'duckduckgo' | 'other';
  url: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface AISearchResponse {
  answer: string;
  sources: SearchResult[];
  citations: string[];
  confidence: number;
}

export class SearchInterceptor {
  private isEnabled = true;
  private interceptedQueries: SearchQuery[] = [];

  constructor() {
    this.initializeInterception();
  }

  private initializeInterception(): void {
    // Intercept navigation to search engines
    if (typeof chrome !== 'undefined' && chrome.webNavigation) {
      chrome.webNavigation.onBeforeNavigate.addListener((details) => {
        if (details.frameId === 0) {
          this.handleNavigation(details.url);
        }
      });
    }
  }

  private handleNavigation(url: string): void {
    if (!this.isEnabled) return;

    const searchQuery = this.extractSearchQuery(url);
    if (searchQuery) {
      this.interceptedQueries.push(searchQuery);
      this.triggerAISearch(searchQuery);
    }
  }

  private extractSearchQuery(url: string): SearchQuery | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Google search
      if (hostname.includes('google.com')) {
        const query = urlObj.searchParams.get('q');
        if (query) {
          return {
            query,
            timestamp: new Date(),
            source: 'google',
            url
          };
        }
      }
      
      // Bing search
      if (hostname.includes('bing.com')) {
        const query = urlObj.searchParams.get('q');
        if (query) {
          return {
            query,
            timestamp: new Date(),
            source: 'bing',
            url
          };
        }
      }
      
      // DuckDuckGo search
      if (hostname.includes('duckduckgo.com')) {
        const query = urlObj.searchParams.get('q');
        if (query) {
          return {
            query,
            timestamp: new Date(),
            source: 'duckduckgo',
            url
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting search query:', error);
      return null;
    }
  }

  private async triggerAISearch(searchQuery: SearchQuery): Promise<void> {
    // Notify the extension to show AI search overlay
    chrome.runtime.sendMessage({
      type: 'SEARCH_INTERCEPTED',
      data: searchQuery
    });
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  getInterceptedQueries(): SearchQuery[] {
    return this.interceptedQueries;
  }

  clearHistory(): void {
    this.interceptedQueries = [];
  }
}