import { streamLlm } from "../../services/llm";
import type { UseLLMOptions } from "../../types";

export interface FactCheck {
  claim: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverified';
  confidence: number;
  sources: string[];
  explanation: string;
}

export class FactChecker {
  async checkFacts(content: string, llmOptions: UseLLMOptions): Promise<FactCheck[]> {
    const factualClaims = this.extractFactualClaims(content);
    if (factualClaims.length === 0) return [];

    const prompt = `Analyze these factual claims for accuracy:

Claims:
${factualClaims.map((claim, i) => `${i + 1}. ${claim}`).join('\n')}

For each claim, provide fact-checking analysis in JSON format:
[
  {
    "claim": "original claim text",
    "verdict": "true|false|misleading|unverified",
    "confidence": 0.85,
    "sources": ["source1", "source2"],
    "explanation": "brief explanation of verdict"
  }
]

Focus on verifiable facts, statistics, and specific claims.`;

    try {
      const stream = streamLlm([{ role: "user", content: prompt }], llmOptions);
      const response = await this.readStream(stream);
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0]);
        return results.map((item: any) => ({
          claim: item.claim || '',
          verdict: item.verdict || 'unverified',
          confidence: item.confidence || 0.5,
          sources: item.sources || [],
          explanation: item.explanation || 'No explanation available'
        }));
      }
    } catch (error) {
      console.error('Fact checking failed:', error);
    }

    return [];
  }

  private extractFactualClaims(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const factualPatterns = [
      /\d+(\.\d+)?%/,                    // Percentages
      /\$[\d,]+/,                       // Money amounts
      /\d{4}/,                          // Years
      /\d+(\.\d+)?\s*(million|billion|thousand)/i, // Large numbers
      /(according to|research shows|study found|data indicates)/i, // Attribution
      /(increased|decreased|rose|fell)\s+by\s+\d+/i, // Changes
      /\b(first|largest|smallest|highest|lowest|most|least)\b/i // Superlatives
    ];

    return sentences.filter(sentence => 
      factualPatterns.some(pattern => pattern.test(sentence))
    ).slice(0, 5); // Limit to 5 claims
  }

  async verifyStatistic(statistic: string, context: string, llmOptions: UseLLMOptions): Promise<FactCheck> {
    const prompt = `Verify this statistic in context:

Statistic: "${statistic}"
Context: "${context}"

Provide fact-check analysis:
{
  "claim": "${statistic}",
  "verdict": "true|false|misleading|unverified",
  "confidence": 0.0-1.0,
  "sources": ["source1", "source2"],
  "explanation": "detailed explanation"
}`;

    try {
      const stream = streamLlm([{ role: "user", content: prompt }], llmOptions);
      const response = await this.readStream(stream);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          claim: result.claim || statistic,
          verdict: result.verdict || 'unverified',
          confidence: result.confidence || 0.5,
          sources: result.sources || [],
          explanation: result.explanation || 'Unable to verify'
        };
      }
    } catch (error) {
      console.error('Statistic verification failed:', error);
    }

    return {
      claim: statistic,
      verdict: 'unverified',
      confidence: 0.3,
      sources: [],
      explanation: 'Could not verify this statistic'
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