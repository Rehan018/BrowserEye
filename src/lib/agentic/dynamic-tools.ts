import type { Tool } from "../../types/agent";
import type { UserIntent } from "./dynamic-agent";
import type { Capability } from "./capability-discovery";

export class DynamicToolGenerator {
  async generateTools(intent: UserIntent, capabilities: Capability[]): Promise<Tool[]> {
    const tools: Tool[] = [];
    
    // Generate tools based on intent and available capabilities
    for (const capability of capabilities) {
      const tool = await this.createToolForCapability(capability, intent);
      if (tool) tools.push(tool);
    }
    
    return tools;
  }

  private async createToolForCapability(capability: Capability, intent: UserIntent): Promise<Tool | null> {
    switch (capability.name) {
      case 'gmail_web':
        return this.createGmailTools(intent);
      
      case 'google_calendar':
        return this.createCalendarTools(intent);
      
      case 'shopping_site':
        return this.createShoppingTools(intent, capability);
      
      case 'web_page':
        return this.createWebPageTools(intent, capability);
      
      default:
        return this.createGenericWebTool(capability);
    }
  }

  private createGmailTools(intent: UserIntent): Tool {
    if (intent.domain === 'email' || intent.requiredCapabilities.includes('email_send')) {
      return {
        name: "gmail_compose_send",
        description: "Compose and send email using Gmail web interface",
        parameters: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient email address" },
            subject: { type: "string", description: "Email subject" },
            body: { type: "string", description: "Email content" },
            action: { type: "string", description: "Action to perform (compose or send)" }
          },
          required: ["action"]
        }
      };
    }
    
    return {
      name: "gmail_interact",
      description: "Interact with Gmail interface",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", description: "Action to perform in Gmail" }
        },
        required: ["action"]
      }
    };
  }

  private createCalendarTools(_intent: UserIntent): Tool {
    return {
      name: "calendar_manage",
      description: "Manage Google Calendar events and scheduling",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", description: "Action to perform (create_event, find_time, or view_schedule)" },
          title: { type: "string", description: "Event title" },
          date: { type: "string", description: "Event date" },
          attendees: { type: "string", description: "Event attendees (comma-separated)" }
        },
        required: ["action"]
      }
    };
  }

  private createShoppingTools(_intent: UserIntent, _capability: Capability): Tool {
    
    return {
      name: "shopping_assistant",
      description: `Find and compare prices for products`,
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", description: "search_product or find_deals" },
          product: { type: "string", description: "Product to search for" },
          query: { type: "string", description: "Search query" }
        },
        required: ["action", "product"]
      }
    };
  }

  private createWebPageTools(_intent: UserIntent, capability: Capability): Tool {
    return {
      name: "web_page_interact",
      description: `Search and interact with ${capability.metadata?.domain}`,
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", description: "Action to perform" },
          query: { type: "string", description: "Search query" },
          product: { type: "string", description: "Product or item to find" },
          value: { type: "string", description: "Value to search for" }
        },
        required: ["action"]
      }
    };
  }

  private createGenericWebTool(capability: Capability): Tool {
    return {
      name: "generic_web_action",
      description: capability.description,
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", description: "Action to perform" },
          target: { type: "string", description: "Target element or data" }
        },
        required: ["action"]
      }
    };
  }
}