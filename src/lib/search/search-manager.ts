import { SearchInterceptor, type SearchQuery } from './search-interceptor';
import { MultiSourceScraper } from './multi-source-scraper';
import { AISearchSynthesizer } from './ai-synthesizer';
import type { UseLLMOptions } from '../../types';

export class SearchManager {
  private interceptor: SearchInterceptor;
  private scraper: MultiSourceScraper;
  private synthesizer: AISearchSynthesizer;
  private isEnabled = true;

  constructor() {
    this.interceptor = new SearchInterceptor();
    this.scraper = new MultiSourceScraper();
    this.synthesizer = new AISearchSynthesizer();
    
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message.type === 'SEARCH_INTERCEPTED') {
        this.handleInterceptedSearch(message.data);
      }
      return true;
    });
  }

  private async handleInterceptedSearch(query: SearchQuery): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Notify UI to show loading overlay
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'SHOW_SEARCH_OVERLAY',
            data: { query, loading: true }
          });
        }
      });

      // Scrape multiple sources
      const searchResults = await this.scraper.scrapeMultipleSources(query.query);
      
      // Get LLM options from storage
      const llmOptions = await this.getLLMOptions();
      
      // Synthesize AI response
      const aiResponse = await this.synthesizer.synthesizeSearchResults(
        query.query,
        searchResults,
        llmOptions
      );

      // Send response to UI
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'SHOW_SEARCH_OVERLAY',
            data: { query, response: aiResponse, loading: false }
          });
        }
      });

    } catch (error) {
      console.error('Error handling intercepted search:', error);
      
      // Show error state
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'SHOW_SEARCH_OVERLAY',
            data: { query, error: true, loading: false }
          });
        }
      });
    }
  }

  private async getLLMOptions(): Promise<UseLLMOptions> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        const settings = result.settings;
        if (settings) {
          resolve({
            provider: settings.selectedProvider,
            model: settings.model,
            apiKey: settings.apiKeys[settings.selectedProvider],
            customUrl: settings.customUrls?.[settings.selectedProvider],
          });
        } else {
          // Fallback to default settings
          resolve({
            provider: 'gemini',
            model: 'gemini-pro',
            apiKey: '',
          });
        }
      });
    });
  }

  enable(): void {
    this.isEnabled = true;
    this.interceptor.enable();
  }

  disable(): void {
    this.isEnabled = false;
    this.interceptor.disable();
  }

  isSearchInterceptionEnabled(): boolean {
    return this.isEnabled;
  }
}