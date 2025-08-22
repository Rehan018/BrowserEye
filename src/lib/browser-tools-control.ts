import type { Tool } from "../types/agent";

export const controlFlowTools: Record<string, Tool> = {
  elementExists: {
    name: "elementExists",
    description: "Check if element exists on page",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for the element"
        }
      },
      required: ["selector"]
    }
  },

  elementIsVisible: {
    name: "elementIsVisible",
    description: "Check if element is visible on page",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for the element"
        }
      },
      required: ["selector"]
    }
  },

  waitForElement: {
    name: "waitForElement",
    description: "Wait for element to appear on page",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for the element"
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default: 10000)"
        }
      },
      required: ["selector"]
    }
  },

  executeJavaScript: {
    name: "executeJavaScript",
    description: "Execute JavaScript code in page context",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "JavaScript code to execute"
        }
      },
      required: ["code"]
    }
  }
};