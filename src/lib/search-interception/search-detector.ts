export interface SearchQuery {
  query: string;
  source: 'google' | 'bing' | 'duckduckgo' | 'yahoo' | 'address_bar' | 'form';
  url: string;
  timestamp: Date;
}

export class SearchDetector {
  private observers: MutationObserver[] = [];
  private onSearchCallback?: (query: SearchQuery) => void;

  constructor(onSearch?: (query: SearchQuery) => void) {
    this.onSearchCallback = onSearch;
    this.init();
  }

  private init(): void {
    this.detectCurrentPageSearch();
    this.setupFormInterception();
    this.setupUrlChangeDetection();
  }

  private detectCurrentPageSearch(): void {
    const url = window.location.href;
    const query = this.extractQueryFromUrl(url);
    
    if (query) {
      this.onSearchCallback?.({
        query,
        source: this.getSearchEngine(url),
        url,
        timestamp: new Date()
      });
    }
  }

  private extractQueryFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      // Google
      if (url.includes('google.com/search')) {
        return urlObj.searchParams.get('q');
      }
      
      // Bing
      if (url.includes('bing.com/search')) {
        return urlObj.searchParams.get('q');
      }
      
      // DuckDuckGo
      if (url.includes('duckduckgo.com')) {
        return urlObj.searchParams.get('q');
      }
      
      // Yahoo
      if (url.includes('search.yahoo.com')) {
        return urlObj.searchParams.get('p');
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private getSearchEngine(url: string): SearchQuery['source'] {
    if (url.includes('google.com')) return 'google';
    if (url.includes('bing.com')) return 'bing';
    if (url.includes('duckduckgo.com')) return 'duckduckgo';
    if (url.includes('yahoo.com')) return 'yahoo';
    return 'form';
  }

  private setupFormInterception(): void {
    // Intercept search form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const searchInput = this.findSearchInput(form);
      
      if (searchInput?.value) {
        this.onSearchCallback?.({
          query: searchInput.value,
          source: 'form',
          url: window.location.href,
          timestamp: new Date()
        });
      }
    });

    // Intercept Enter key on search inputs
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const target = event.target as HTMLInputElement;
        if (this.isSearchInput(target) && target.value) {
          this.onSearchCallback?.({
            query: target.value,
            source: 'form',
            url: window.location.href,
            timestamp: new Date()
          });
        }
      }
    });
  }

  private findSearchInput(form: HTMLFormElement): HTMLInputElement | null {
    const inputs = form.querySelectorAll('input[type="text"], input[type="search"], input[name*="search"], input[name*="query"], input[name="q"]');
    return inputs[0] as HTMLInputElement || null;
  }

  private isSearchInput(element: HTMLInputElement): boolean {
    const searchIndicators = [
      'search', 'query', 'q', 'find', 'lookup'
    ];
    
    const name = element.name?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    const placeholder = element.placeholder?.toLowerCase() || '';
    
    return searchIndicators.some(indicator => 
      name.includes(indicator) || 
      id.includes(indicator) || 
      placeholder.includes(indicator)
    );
  }

  private setupUrlChangeDetection(): void {
    let lastUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.detectCurrentPageSearch();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.observers.push(observer);
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}