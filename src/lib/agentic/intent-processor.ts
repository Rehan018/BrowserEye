import { streamLlm } from "../../services/llm";
import type { UseLLMOptions } from "../../types";
import type { UserIntent } from "./dynamic-agent";

export class DynamicIntentProcessor {
  async processUserRequest(request: string, context: any, llmOptions: UseLLMOptions): Promise<UserIntent> {
    const prompt = `Analyze this user request and extract structured information:

User Request: "${request}"
Current Context: ${JSON.stringify(context, null, 2)}

Extract and return JSON with:
{
  "goal": "clear description of what user wants to accomplish",
  "domain": "primary domain (email, calendar, shopping, research, social, etc.)",
  "entities": ["key entities mentioned like names, dates, products"],
  "confidence": 0.95,
  "requiredCapabilities": ["list of capabilities needed like email_send, web_search, etc."],
  "context": "relevant context information"
}

Focus on understanding the user's true intent, not just keywords.`;

    try {
      const stream = streamLlm([{ role: "user", content: prompt }], llmOptions);
      const response = await this.readStream(stream);
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          goal: parsed.goal || request,
          domain: parsed.domain || "general",
          entities: parsed.entities || [],
          confidence: parsed.confidence || 0.7,
          requiredCapabilities: parsed.requiredCapabilities || [],
          context: parsed.context || context
        };
      }
    } catch (error) {
      console.error("Intent processing failed:", error);
    }

    // Fallback intent
    return {
      goal: request,
      domain: "general",
      entities: [],
      confidence: 0.5,
      requiredCapabilities: ["web_automation"],
      context
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