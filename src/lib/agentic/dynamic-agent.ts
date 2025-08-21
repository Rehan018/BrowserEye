import type { UseLLMOptions } from "../../types";
import { CapabilityDiscovery } from "./capability-discovery";
import { DynamicIntentProcessor } from "./intent-processor";
import { DynamicToolGenerator } from "./dynamic-tools";
import { AdaptiveExecutor } from "./adaptive-executor";

export interface UserIntent {
  goal: string;
  domain: string;
  entities: string[];
  confidence: number;
  requiredCapabilities: string[];
  context: any;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  nextActions?: string[];
}

export class DynamicAgent {
  private intentProcessor: DynamicIntentProcessor;
  private capabilityDiscovery: CapabilityDiscovery;
  private toolGenerator: DynamicToolGenerator;
  private executor: AdaptiveExecutor;

  constructor() {
    this.intentProcessor = new DynamicIntentProcessor();
    this.capabilityDiscovery = new CapabilityDiscovery();
    this.toolGenerator = new DynamicToolGenerator();
    this.executor = new AdaptiveExecutor();
  }

  async processUserRequest(
    request: string,
    context: any,
    llmOptions: UseLLMOptions
  ): Promise<ExecutionResult> {
    try {
      const intent = await this.intentProcessor.processUserRequest(request, context, llmOptions);
      const capabilities = await this.capabilityDiscovery.discoverCurrentCapabilities();
      const tools = await this.toolGenerator.generateTools(intent, capabilities);
      const result = await this.executor.executeIntent(intent, tools, llmOptions);
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextActions: ["Try rephrasing your request", "Check if the required service is accessible"]
      };
    }
  }

  async suggestCapabilities(): Promise<string[]> {
    const capabilities = await this.capabilityDiscovery.discoverCurrentCapabilities();
    return capabilities.map(cap => cap.description);
  }
}