import { streamLlm } from '../../services/llm';
import type { AggregatedData, SearchSource } from './data-aggregator';

export interface SynthesizedAnswer {
  answer: string;
  citations: Citation[];
  confidence: number;
  followUpQuestions: string[];
}

export interface Citation {
  id: number;
  title: string;
  url: string;
  snippet: string;
}

export class AnswerSynthesizer {
  async synthesizeAnswer(
    data: AggregatedData,
    llmOptions: any
  ): Promise<SynthesizedAnswer> {
    const prompt = this.buildPrompt(data);
    
    try {
      const stream = streamLlm([{ role: 'user', content: prompt }], llmOptions);
      const reader = stream.getReader();
      let answer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += value;
      }
      
      return {
        answer: this.cleanAnswer(answer),
        citations: this.createCitations(data.sources),
        confidence: this.calculateConfidence(data.sources),
        followUpQuestions: this.generateFollowUps(data.query, answer)
      };
    } catch (error) {
      console.error('Answer synthesis failed:', error);
      return this.createFallbackAnswer(data);
    }
  }

  private buildPrompt(data: AggregatedData): string {
    const sourcesText = data.sources
      .map((source, index) => `[${index + 1}] ${source.title}: ${source.snippet}`)
      .join('\n\n');

    return `You are an AI search assistant. Based on the following sources, provide a comprehensive, accurate answer to the query: "${data.query}"

Sources:
${sourcesText}

Instructions:
1. Synthesize information from multiple sources
2. Provide a clear, conversational answer
3. Include relevant details and context
4. Use citation numbers [1], [2], etc. to reference sources
5. Keep the answer concise but informative (2-3 paragraphs max)
6. If sources conflict, mention the different perspectives

Answer:`;
  }

  private cleanAnswer(answer: string): string {
    // Remove any unwanted prefixes or formatting
    return answer
      .replace(/^(Answer:|Response:)/i, '')
      .trim();
  }

  private createCitations(sources: SearchSource[]): Citation[] {
    return sources.map((source, index) => ({
      id: index + 1,
      title: source.title,
      url: source.url,
      snippet: source.snippet.substring(0, 150) + (source.snippet.length > 150 ? '...' : '')
    }));
  }

  private calculateConfidence(sources: SearchSource[]): number {
    if (sources.length === 0) return 0;
    
    const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length;
    const sourceCount = Math.min(sources.length / 5, 1); // Max confidence at 5+ sources
    
    return Math.round((avgRelevance * 0.7 + sourceCount * 0.3) * 100);
  }

  private generateFollowUps(query: string, answer: string): string[] {
    const followUps = [
      `How does ${query} work?`,
      `What are the benefits of ${query}?`,
      `Where can I learn more about ${query}?`
    ];
    
    // Simple logic to generate contextual follow-ups
    if (answer.toLowerCase().includes('history')) {
      followUps.push(`What is the history of ${query}?`);
    }
    
    if (answer.toLowerCase().includes('cost') || answer.toLowerCase().includes('price')) {
      followUps.push(`How much does ${query} cost?`);
    }
    
    return followUps.slice(0, 3);
  }

  private createFallbackAnswer(data: AggregatedData): SynthesizedAnswer {
    return {
      answer: data.summary || `I found information about "${data.query}" but couldn't synthesize a complete answer. Please check the sources below for more details.`,
      citations: this.createCitations(data.sources),
      confidence: 30,
      followUpQuestions: data.relatedQuestions
    };
  }
}