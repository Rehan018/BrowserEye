import { streamLlm } from "../../services/llm";
import type { UseLLMOptions } from "../../types";
import type { Tool } from "../../types/agent";
import type { UserIntent, ExecutionResult } from "./dynamic-agent";
import { browserHandlers } from "../browser-handlers";

export class AdaptiveExecutor {
  async executeIntent(intent: UserIntent, tools: Tool[], llmOptions: UseLLMOptions): Promise<ExecutionResult> {
    try {
      // Create execution plan using AI
      const plan = await this.createExecutionPlan(intent, tools, llmOptions);
      
      // Execute the plan with adaptive fallbacks
      const result = await this.executePlan(plan, intent);
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextActions: ["Try a different approach", "Check if the service is available"]
      };
    }
  }

  private async createExecutionPlan(intent: UserIntent, tools: Tool[], llmOptions: UseLLMOptions): Promise<any> {
    const prompt = `Create an execution plan for this user intent:

Intent: ${JSON.stringify(intent, null, 2)}

Available Tools: ${JSON.stringify(tools.map(t => ({ name: t.name, description: t.description })), null, 2)}

Create a step-by-step plan that:
1. Uses available tools effectively
2. Handles potential failures
3. Provides fallback options
4. Achieves the user's goal

Return JSON format:
{
  "steps": [
    {
      "action": "tool_name",
      "parameters": {...},
      "description": "what this step does",
      "fallbacks": ["alternative approaches"]
    }
  ]
}`;

    const stream = streamLlm([{ role: "user", content: prompt }], llmOptions);
    const response = await this.readStream(stream);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Plan parsing failed:", error);
    }
    
    // Fallback plan
    return {
      steps: [
        {
          action: "web_page_interact",
          parameters: { action: intent.goal },
          description: "Attempt to fulfill user request",
          fallbacks: ["manual_guidance"]
        }
      ]
    };
  }

  private async executePlan(plan: any, intent: UserIntent): Promise<ExecutionResult> {
    const results: any[] = [];
    
    for (const step of plan.steps) {
      try {
        const result = await this.executeStep(step, intent);
        results.push(result);
        
        if (!result.success && step.fallbacks) {
          // Try fallback approaches
          for (const fallback of step.fallbacks) {
            const fallbackResult = await this.executeFallback(fallback, step, intent);
            if (fallbackResult.success) {
              results.push(fallbackResult);
              break;
            }
          }
        }
      } catch (error) {
        console.error(`Step execution failed:`, error);
        results.push({
          success: false,
          message: `Step failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
    
    const successfulSteps = results.filter(r => r.success);
    const hasSuccess = successfulSteps.length > 0;
    
    return {
      success: hasSuccess,
      message: hasSuccess 
        ? `Successfully executed ${successfulSteps.length} out of ${results.length} steps`
        : "All execution steps failed",
      data: results,
      nextActions: hasSuccess ? [] : ["Try rephrasing your request", "Check if the required service is accessible"]
    };
  }

  private async executeStep(step: any, _intent: UserIntent): Promise<any> {
    const { action, parameters } = step;
    
    // Map actions to browser handlers
    switch (action) {
      case 'gmail_compose_send':
        return await this.executeGmailAction(parameters);
      
      case 'calendar_manage':
        return await this.executeCalendarAction(parameters);
      
      case 'shopping_assistant':
        return await this.executeShoppingAction(parameters);
      
      case 'web_page_interact':
        return await this.executeWebPageAction(parameters);
      
      default:
        return await this.executeGenericAction(action, parameters);
    }
  }

  private async executeGmailAction(params: any): Promise<any> {
    try {
      if (params.action === 'compose') {
        // Navigate to compose if not already there
        const currentTab = await browserHandlers.getCurrentTab() as any;
        if (!currentTab.url?.includes('compose')) {
          await browserHandlers.clickElement({ selector: '[gh="cm"]' }); // Gmail compose button
        }
        
        // Fill email fields
        if (params.to) {
          await browserHandlers.fillInput({ selector: '[name="to"]', value: params.to });
        }
        if (params.subject) {
          await browserHandlers.fillInput({ selector: '[name="subjectbox"]', value: params.subject });
        }
        if (params.body) {
          await browserHandlers.fillInput({ selector: '[contenteditable="true"]', value: params.body });
        }
        
        return { success: true, message: "Email composed successfully" };
      }
      
      if (params.action === 'send') {
        await browserHandlers.clickElement({ selector: '[role="button"][tabindex="1"]' }); // Send button
        return { success: true, message: "Email sent successfully" };
      }
      
      return { success: false, message: "Unknown Gmail action" };
    } catch (error) {
      return { success: false, message: `Gmail action failed: ${error}` };
    }
  }

  private async executeCalendarAction(_params: any): Promise<any> {
    // Calendar actions would be implemented here
    return { success: false, message: "Calendar actions not yet implemented" };
  }

  private async executeShoppingAction(params: any): Promise<any> {
    try {
      if (params.action === 'search_product' || params.action === 'compare_prices') {
        // First navigate to Google to search for the product
        await browserHandlers.searchGoogle({ query: params.product || params.query });
        
        // Wait a moment for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to get shopping results or product information
        await browserHandlers.getPageContent({});
        
        return { 
          success: true, 
          message: `Found search results for ${params.product || params.query}`,
          data: { searchPerformed: true, query: params.product || params.query }
        };
      }
      
      if (params.action === 'find_deals') {
        const dealQuery = `${params.product} deals discount sale`;
        await browserHandlers.searchGoogle({ query: dealQuery });
        
        return { 
          success: true, 
          message: `Searching for deals on ${params.product}`,
          data: { searchPerformed: true, query: dealQuery }
        };
      }
      
      return { success: false, message: "Shopping action not implemented" };
    } catch (error) {
      return { success: false, message: `Shopping action failed: ${error}` };
    }
  }

  private async executeWebPageAction(params: any): Promise<any> {
    try {
      const { action, selector, value } = params;
      
      // Handle search actions
      if (action.includes('search') || action.includes('find')) {
        const searchQuery = value || params.query || params.product;
        if (searchQuery) {
          await browserHandlers.searchGoogle({ query: searchQuery });
          return { success: true, message: `Searched for: ${searchQuery}` };
        }
      }
      
      if (action.includes('click')) {
        await browserHandlers.clickElement({ selector: selector || 'button' });
        return { success: true, message: "Clicked element" };
      }
      
      if (action.includes('fill') || action.includes('input')) {
        await browserHandlers.fillInput({ selector: selector || 'input', value: value || '' });
        return { success: true, message: "Filled input" };
      }
      
      if (action.includes('navigate')) {
        await browserHandlers.navigateToUrl({ url: value || '' });
        return { success: true, message: "Navigated to URL" };
      }
      
      // Fallback: try to search for the action as a query
      if (action && !selector) {
        await browserHandlers.searchGoogle({ query: action });
        return { success: true, message: `Searched for: ${action}` };
      }
      
      return { success: false, message: "Unknown web page action" };
    } catch (error) {
      return { success: false, message: `Web page action failed: ${error}` };
    }
  }

  private async executeGenericAction(action: string, params: any): Promise<any> {
    try {
      // Try to interpret the action as a search query
      const searchTerms = [action, params?.query, params?.product, params?.target].filter(Boolean);
      
      if (searchTerms.length > 0) {
        const searchQuery = searchTerms.join(' ');
        await browserHandlers.searchGoogle({ query: searchQuery });
        return { 
          success: true, 
          message: `Performed search for: ${searchQuery}`,
          data: { searchPerformed: true, query: searchQuery }
        };
      }
      
      return { success: false, message: `Could not interpret action: ${action}` };
    } catch (error) {
      return { success: false, message: `Generic action failed: ${error}` };
    }
  }

  private async executeFallback(fallback: string, originalStep: any, _intent: UserIntent): Promise<any> {
    // Implement fallback strategies
    if (fallback === 'manual_guidance') {
      return {
        success: true,
        message: `I couldn't complete the action automatically. Here's what you can try: ${originalStep.description}`,
        data: { guidance: true }
      };
    }
    
    return { success: false, message: "Fallback not implemented" };
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