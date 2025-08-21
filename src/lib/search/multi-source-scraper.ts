import type { SearchResult } from './search-interceptor';

export class MultiSourceScraper {


  async scrapeMultipleSources(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    try {
      // Use background script to fetch search results
      const response = await chrome.runtime.sendMessage({
        type: 'SCRAPE_SEARCH_RESULTS',
        data: { query }
      });
      
      if (response && response.results) {
        results.push(...response.results);
      }
    } catch (error) {
      console.error('Error scraping search results:', error);
    }
    
    return results;
  }

  async scrapeWebpage(url: string): Promise<{ title: string; content: string; } | null> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SCRAPE_WEBPAGE',
        data: { url }
      });
      
      return response || null;
    } catch (error) {
      console.error('Error scraping webpage:', error);
      return null;
    }
  }

  async extractKeyInformation(content: string): Promise<string[]> {
    // Extract key sentences and facts from content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Simple heuristic: return sentences with important keywords
    const importantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return (
        lowerSentence.includes('according to') ||
        lowerSentence.includes('research shows') ||
        lowerSentence.includes('study found') ||
        lowerSentence.includes('data indicates') ||
        lowerSentence.includes('experts say') ||
        /\d{4}/.test(sentence) || // Contains year
        /\d+%/.test(sentence) || // Contains percentage
        /\$[\d,]+/.test(sentence) // Contains money amount
      );
    });
    
    return importantSentences.slice(0, 5); // Return top 5 key facts
  }
}