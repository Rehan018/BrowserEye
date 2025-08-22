import { SearchDetector, type SearchQuery } from './search-detector';
import { DataAggregator } from './data-aggregator';
import { AnswerSynthesizer } from './answer-synthesizer';
import { SearchOverlay } from '../../components/search/SearchOverlay';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';

export class SearchInterceptor {
  private detector: SearchDetector;
  private aggregator: DataAggregator;
  private synthesizer: AnswerSynthesizer;
  private overlayContainer: HTMLElement | null = null;
  private showOriginal = false;

  constructor() {
    this.detector = new SearchDetector(this.handleSearch.bind(this));
    this.aggregator = new DataAggregator();
    this.synthesizer = new AnswerSynthesizer();
    
    this.init();
  }

  private init(): void {
    // Only activate on search engine pages
    if (this.isSearchEnginePage()) {
      this.setupOverlayContainer();
    }
  }

  private isSearchEnginePage(): boolean {
    const url = window.location.href;
    return url.includes('google.com/search') ||
           url.includes('bing.com/search') ||
           url.includes('duckduckgo.com') ||
           url.includes('search.yahoo.com');
  }

  private setupOverlayContainer(): void {
    // Find search results container
    const searchContainer = this.findSearchContainer();
    if (!searchContainer) return;

    // Create overlay container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'browsereye-search-overlay';
    this.overlayContainer.style.cssText = `
      position: relative;
      z-index: 1000;
      margin-bottom: 20px;
    `;

    // Insert before search results
    searchContainer.parentNode?.insertBefore(this.overlayContainer, searchContainer);
  }

  private findSearchContainer(): HTMLElement | null {
    // Google
    if (window.location.href.includes('google.com')) {
      return document.querySelector('#search') as HTMLElement ||
             document.querySelector('#rso') as HTMLElement;
    }
    
    // Bing
    if (window.location.href.includes('bing.com')) {
      return document.querySelector('#b_results') as HTMLElement;
    }
    
    // DuckDuckGo
    if (window.location.href.includes('duckduckgo.com')) {
      return document.querySelector('#links') as HTMLElement;
    }
    
    return null;
  }

  private async handleSearch(searchQuery: SearchQuery): Promise<void> {
    if (!this.overlayContainer) return;

    try {
      // Show loading state
      this.renderOverlay(null, searchQuery.query, true);

      // Get settings for LLM
      const settings = await chrome.storage.sync.get(['selectedProvider', 'model', 'apiKeys']);
      if (!settings.selectedProvider || !settings.apiKeys?.[settings.selectedProvider]) {
        this.renderError('Please configure AI provider in BrowserEye settings');
        return;
      }

      // Aggregate data from multiple sources
      const aggregatedData = await this.aggregator.aggregateData(searchQuery.query);
      
      // Synthesize AI answer
      const llmOptions = {
        provider: settings.selectedProvider,
        model: settings.model,
        apiKey: settings.apiKeys[settings.selectedProvider],
        customUrl: settings.customUrls?.[settings.selectedProvider]
      };

      const answer = await this.synthesizer.synthesizeAnswer(aggregatedData, llmOptions);
      
      // Render the overlay
      this.renderOverlay(answer, searchQuery.query, false);
      
    } catch (error) {
      console.error('Search interception failed:', error);
      this.renderError('Failed to generate AI answer');
    }
  }

  private renderOverlay(answer: any, query: string, isLoading: boolean): void {
    if (!this.overlayContainer) return;

    const root = createRoot(this.overlayContainer);
    
    if (isLoading) {
      root.render(createElement(SearchOverlay, {
        answer: { answer: '', citations: [], confidence: 0, followUpQuestions: [] },
        query,
        onToggleOriginal: () => {},
        showOriginal: false,
        isLoading: true
      }));
    } else if (answer) {
      root.render(createElement(SearchOverlay, {
        answer,
        query,
        onToggleOriginal: this.toggleOriginalResults.bind(this),
        showOriginal: this.showOriginal,
        isLoading: false
      }));
    }
  }

  private renderError(message: string): void {
    if (!this.overlayContainer) return;

    this.overlayContainer.innerHTML = `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="color: #dc2626; font-weight: 500;">BrowserEye AI Search</div>
        <div style="color: #7f1d1d; margin-top: 4px;">${message}</div>
      </div>
    `;
  }

  private toggleOriginalResults(): void {
    this.showOriginal = !this.showOriginal;
    const searchContainer = this.findSearchContainer();
    
    if (searchContainer) {
      searchContainer.style.display = this.showOriginal ? 'block' : 'none';
    }
  }

  public destroy(): void {
    this.detector.destroy();
    if (this.overlayContainer) {
      this.overlayContainer.remove();
    }
  }
}