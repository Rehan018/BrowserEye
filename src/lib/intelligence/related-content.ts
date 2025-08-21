import { streamLlm } from "../../services/llm";
import type { UseLLMOptions } from "../../types";

export interface RelatedLink {
  title: string;
  url: string;
  description: string;
  relevance: number;
  type: 'article' | 'video' | 'documentation' | 'tool' | 'course';
}

export class RelatedContentFinder {
  async findRelatedContent(
    pageContent: string,
    pageUrl: string,
    llmOptions: UseLLMOptions
  ): Promise<RelatedLink[]> {
    const prompt = `Based on this webpage content, suggest 5 highly relevant resources:

URL: ${pageUrl}
Content: ${pageContent.substring(0, 4000)}

For each suggestion, provide:
1. A descriptive title
2. A likely URL (use real, popular sites)
3. Brief description of why it's relevant
4. Type: article, video, documentation, tool, or course

Format as JSON array:
[
  {
    "title": "Resource title",
    "url": "https://example.com/resource",
    "description": "Why this is relevant",
    "relevance": 0.9,
    "type": "article"
  }
]`;

    try {
      const stream = streamLlm([{ role: "user", content: prompt }], llmOptions);
      const response = await this.readStream(stream);
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions.map((item: any) => ({
          title: item.title || 'Related Resource',
          url: item.url || '#',
          description: item.description || 'Relevant content',
          relevance: item.relevance || 0.5,
          type: item.type || 'article'
        }));
      }
    } catch (error) {
      console.error('Related content search failed:', error);
    }

    return this.getFallbackSuggestions(pageUrl);
  }

  private getFallbackSuggestions(pageUrl: string): RelatedLink[] {
    const domain = new URL(pageUrl).hostname;
    
    return [
      {
        title: `More from ${domain}`,
        url: `https://${domain}`,
        description: 'Explore more content from this website',
        relevance: 0.7,
        type: 'article'
      },
      {
        title: 'Wikipedia',
        url: 'https://wikipedia.org',
        description: 'Find background information and definitions',
        relevance: 0.6,
        type: 'article'
      },
      {
        title: 'YouTube',
        url: 'https://youtube.com',
        description: 'Find video explanations and tutorials',
        relevance: 0.5,
        type: 'video'
      }
    ];
  }

  async searchSimilarPages(query: string): Promise<RelatedLink[]> {
    // This would integrate with search APIs in a real implementation
    const searchQueries = [
      `${query} tutorial`,
      `${query} guide`,
      `${query} documentation`,
      `${query} examples`
    ];

    return searchQueries.map((searchQuery, index) => ({
      title: `${searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1)}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      description: `Search results for ${searchQuery}`,
      relevance: 0.8 - (index * 0.1),
      type: 'article' as const
    }));
  }

  private async readStream(stream: ReadableStream<string>): Promise<string> {
    const reader = stream.getReader();
    let result = "";
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += value;
      }
    } finally {
      reader.releaseLock();
    }
    
    return result;
  }
}