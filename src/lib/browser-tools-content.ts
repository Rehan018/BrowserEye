import type { Tool } from "../types/agent";

export const contentManipulationTools: Record<string, Tool> = {
  extractTableData: {
    name: "extractTableData",
    description: "Extract data from HTML table into structured format",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for the table element"
        }
      },
      required: ["selector"]
    }
  },

  extractLinks: {
    name: "extractLinks",
    description: "Extract all links from page or specific element",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for container (optional, defaults to entire page)"
        }
      },
      required: []
    }
  },

  readLocalStorage: {
    name: "readLocalStorage",
    description: "Read data from browser local storage",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Storage key to read (optional, returns all if not specified)"
        }
      },
      required: []
    }
  },

  writeLocalStorage: {
    name: "writeLocalStorage",
    description: "Write data to browser local storage",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Storage key"
        },
        value: {
          type: "string",
          description: "Value to store"
        }
      },
      required: ["key", "value"]
    }
  },

  readSessionStorage: {
    name: "readSessionStorage",
    description: "Read data from browser session storage",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Storage key to read (optional, returns all if not specified)"
        }
      },
      required: []
    }
  },

  writeSessionStorage: {
    name: "writeSessionStorage",
    description: "Write data to browser session storage",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Storage key"
        },
        value: {
          type: "string",
          description: "Value to store"
        }
      },
      required: ["key", "value"]
    }
  },

  getCookies: {
    name: "getCookies",
    description: "Get cookies for current domain",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Cookie name (optional, returns all if not specified)"
        }
      },
      required: []
    }
  },

  setCookies: {
    name: "setCookies",
    description: "Set cookie for current domain",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Cookie name"
        },
        value: {
          type: "string",
          description: "Cookie value"
        },
        expires: {
          type: "string",
          description: "Expiration date (optional)"
        }
      },
      required: ["name", "value"]
    }
  }
};