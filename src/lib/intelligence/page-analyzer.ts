import { streamLlm } from "../../services/llm";
import type { UseLLMOptions } from "../../types";

export interface PageAnalysis {
  summary: string;
  keyPoints: string[];
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  readingTime: number;
  complexity: 'simple' | 'moderate' | 'complex';
  factClaims: string[];
}

export class PageAnalyzer {
  async analyzePage(content: string, url: string, llmOptions: UseLLMOptions): Promise<PageAnalysis> {
    const prompt = `Analyze this webpage content and provide structured insights:

URL: ${url}
Content: ${content.substring(0, 8000)}

Provide analysis in this JSON format:
{
  "summary": "Brief 2-3 sentence summary",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "topics": ["topic1", "topic2", "topic3"],
  "sentiment": "positive|negative|neutral",
  "readingTime": estimated_minutes,
  "complexity": "simple|moderate|complex",
  "factClaims": ["factual claim 1", "factual claim 2"]
}`;

    try {
      const stream = streamLlm([{ role: "user", content: prompt }], llmOptions);
      const response = await this.readStream(stream);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          summary: analysis.summary || 'No summary available',
          keyPoints: analysis.keyPoints || [],
          topics: analysis.topics || [],
          sentiment: analysis.sentiment || 'neutral',
          readingTime: analysis.readingTime || 5,
          complexity: analysis.complexity || 'moderate',
          factClaims: analysis.factClaims || []
        };
      }
    } catch (error) {
      console.error('Page analysis failed:', error);
    }

    return this.getFallbackAnalysis(content);
  }

  private getFallbackAnalysis(content: string): PageAnalysis {
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    return {
      summary: 'Page analysis unavailable',
      keyPoints: [],
      topics: [],
      sentiment: 'neutral',
      readingTime,
      complexity: wordCount > 2000 ? 'complex' : wordCount > 500 ? 'moderate' : 'simple',
      factClaims: []
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