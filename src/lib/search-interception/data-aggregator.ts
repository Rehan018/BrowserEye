export interface SearchSource {
  name: string;
  url: string;
  title: string;
  snippet: string;
  relevance: number;
}

export interface AggregatedData {
  query: string;
  sources: SearchSource[];
  summary: string;
  relatedQuestions: string[];
  timestamp: Date;
}

export class DataAggregator {
  private async scrapeGoogleResults(query: string): Promise<SearchSource[]> {
    try {
      // Use existing page content if we're on Google
      if (window.location.href.includes('google.com/search')) {
        return this.extractGoogleResults();
      }
      
      // Otherwise, search via background script
      const response = await chrome.runtime.sendMessage({
        type: 'SEARCH_GOOGLE',
        query
      });
      
      return response?.results || [];
    } catch (error) {
      console.error('Google scraping failed:', error);
      return [];
    }
  }

  private extractGoogleResults(): SearchSource[] {
    const results: SearchSource[] = [];
    const resultElements = document.querySelectorAll('[data-ved] h3');
    
    resultElements.forEach((element, index) => {
      const linkElement = element.closest('a') as HTMLAnchorElement;
      const snippetElement = element.closest('[data-ved]')?.querySelector('[data-sncf]');
      
      if (linkElement && element.textContent) {
        results.push({
          name: 'Google',
          url: linkElement.href,
          title: element.textContent,
          snippet: snippetElement?.textContent || '',
          relevance: 1 - (index * 0.1)
        });
      }
    });
    
    return results.slice(0, 5); // Top 5 results
  }

  private async scrapeWikipedia(query: string): Promise<SearchSource[]> {
    try {
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        return [{
          name: 'Wikipedia',
          url: data.content_urls?.desktop?.page || '',
          title: data.title || '',
          snippet: data.extract || '',
          relevance: 0.9
        }];
      }
    } catch (error) {
      console.error('Wikipedia scraping failed:', error);
    }
    
    return [];
  }

  public async aggregateData(query: string): Promise<AggregatedData> {
    const sources: SearchSource[] = [];
    
    // Collect from multiple sources
    const [googleResults, wikipediaResults] = await Promise.all([
      this.scrapeGoogleResults(query),
      this.scrapeWikipedia(query)
    ]);
    
    sources.push(...googleResults, ...wikipediaResults);
    
    // Sort by relevance
    sources.sort((a, b) => b.relevance - a.relevance);
    
    return {
      query,
      sources: sources.slice(0, 8), // Top 8 sources
      summary: this.generateSummary(sources),
      relatedQuestions: this.generateRelatedQuestions(query),
      timestamp: new Date()
    };
  }

  private generateSummary(sources: SearchSource[]): string {
    if (sources.length === 0) return '';
    
    // Combine top snippets
    const topSnippets = sources
      .slice(0, 3)
      .map(s => s.snippet)
      .filter(s => s.length > 0)
      .join(' ');
    
    return topSnippets.substring(0, 500) + (topSnippets.length > 500 ? '...' : '');
  }

  private generateRelatedQuestions(query: string): string[] {
    const questionStarters = [
      'What is',
      'How does',
      'Why is',
      'When did',
      'Where can I find'
    ];
    
    return questionStarters.map(starter => `${starter} ${query}?`).slice(0, 3);
  }
}