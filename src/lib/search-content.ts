import { createRoot } from 'react-dom/client';
import { SearchOverlay } from '../components/search/SearchOverlay';
import type { SearchQuery, AISearchResponse } from './search/search-interceptor';

class SearchContentManager {
  private overlayContainer: HTMLDivElement | null = null;
  private root: any = null;
  private currentQuery: SearchQuery | null = null;
  private currentResponse: AISearchResponse | null = null;
  private isLoading = false;

  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message.type === 'SHOW_SEARCH_OVERLAY') {
        this.handleShowOverlay(message.data);
      }
      return true;
    });
  }

  private handleShowOverlay(data: any): void {
    const { query, response, loading, error } = data;
    
    this.currentQuery = query;
    this.currentResponse = response || null;
    this.isLoading = loading || false;

    if (error) {
      this.currentResponse = null;
      this.isLoading = false;
    }

    this.showOverlay();
  }

  private showOverlay(): void {
    if (!this.currentQuery) return;

    // Create overlay container if it doesn't exist
    if (!this.overlayContainer) {
      this.overlayContainer = document.createElement('div');
      this.overlayContainer.id = 'browsereye-search-overlay';
      this.overlayContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2147483647;
        pointer-events: auto;
      `;
      document.body.appendChild(this.overlayContainer);

      // Create React root
      this.root = createRoot(this.overlayContainer);
    }

    // Render the overlay
    this.root.render(
      SearchOverlay({
        query: this.currentQuery,
        response: this.currentResponse,
        isLoading: this.isLoading,
        onClose: () => this.hideOverlay(),
        onRetry: () => this.retrySearch()
      })
    );
  }

  private hideOverlay(): void {
    if (this.overlayContainer) {
      this.overlayContainer.remove();
      this.overlayContainer = null;
      this.root = null;
    }
    
    this.currentQuery = null;
    this.currentResponse = null;
    this.isLoading = false;
  }

  private retrySearch(): void {
    if (this.currentQuery) {
      this.isLoading = true;
      this.currentResponse = null;
      this.showOverlay();
      
      // Trigger new search
      chrome.runtime.sendMessage({
        type: 'SEARCH_INTERCEPTED',
        data: this.currentQuery
      });
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