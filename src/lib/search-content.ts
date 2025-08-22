import { SearchInterceptor } from './search-interception/search-interceptor';

class SearchContentManager {
  private interceptor: SearchInterceptor | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // Check if search interception is enabled
    chrome.storage.sync.get(['searchInterceptionEnabled'], (result) => {
      if (result.searchInterceptionEnabled !== false) { // Default to enabled
        this.startInterception();
      }
    });

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.searchInterceptionEnabled) {
        if (changes.searchInterceptionEnabled.newValue) {
          this.startInterception();
        } else {
          this.stopInterception();
        }
      }
    });
  }

  private startInterception(): void {
    if (!this.interceptor) {
      this.interceptor = new SearchInterceptor();
    }
  }

  private stopInterception(): void {
    if (this.interceptor) {
      this.interceptor.destroy();
      this.interceptor = null;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SearchContentManager();
  });
} else {
  new SearchContentManager();
}