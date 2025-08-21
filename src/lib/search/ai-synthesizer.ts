import { streamLlm } from "../../services/llm";
import type { UseLLMOptions } from "../../types";
import type { SearchResult, AISearchResponse } from './search-interceptor';

export class AISearchSynthesizer {
  async synthesizeSearchResults(
    query: string,
    results: SearchResult[],
    llmOptions: UseLLMOptions
  ): Promise<AISearchResponse> {
    try {
      const synthesisPrompt = this.buildSynthesisPrompt(query, results);
      
      const stream = streamLlm([{ role: "user", content: synthesisPrompt }], llmOptions);
      const response = await this.readStream(stream);
      
      return this.parseAIResponse(response, results);
    } catch (error) {
      console.error('Error synthesizing search results:', error);
      return {
        answer: `I found ${results.length} sources about "${query}" but couldn't synthesize them. Here are the key results.`,
        sources: results.slice(0, 5),
        citations: results.slice(0, 5).map((_, i) => `[${i + 1}]`),
        confidence: 0.3
      };
    }
  }

  private buildSynthesisPrompt(query: string, results: SearchResult[]): string {
    const sourcesText = results.map((result, index) => 
      `[${index + 1}] ${result.title}\n${result.snippet}\nSource: ${result.url}\n`
    ).join('\n');

    return `You are an AI research assistant. Synthesize information from multiple sources to answer the user's query comprehensively.

Query: "${query}"

Sources:
${sourcesText}

Instructions:
1. Provide a comprehensive, well-structured answer
2. Include specific facts and data from the sources
3. Use citations [1], [2], etc. to reference sources
4. If sources conflict, mention the disagreement
5. Be objective and factual
6. End with a confidence score (0.0-1.0)

Format your response as:
ANSWER: [Your comprehensive answer with citations]
CONFIDENCE: [0.0-1.0]`;
  }

  private parseAIResponse(response: string, sources: SearchResult[]): AISearchResponse {
    const answerMatch = response.match(/ANSWER:\s*([\s\S]*?)(?=CONFIDENCE:|$)/);
    const confidenceMatch = response.match(/CONFIDENCE:\s*([\d.]+)/);
    
    const answer = answerMatch ? answerMatch[1].trim() : response;
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;
    
    // Extract citations from the answer
    const citationMatches = answer.match(/\[(\d+)\]/g) || [];
    const citations = [...new Set(citationMatches)];
    
    return {
      answer,
      sources: sources.slice(0, 10), // Limit to top 10 sources
      citations,
      confidence: Math.min(Math.max(confidence, 0), 1) // Clamp between 0 and 1
    };
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