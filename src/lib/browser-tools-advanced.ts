import type { Tool } from "../types/agent";

export const advancedBrowserTools: Record<string, Tool> = {
  getElementAttributes: {
    name: "getElementAttributes",
    description: "Get all attributes of an element",
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

  setElementAttributes: {
    name: "setElementAttributes", 
    description: "Set attributes of an element",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for the element"
        },
        attributes: {
          type: "object",
          description: "Object with attribute names and values"
        }
      },
      required: ["selector", "attributes"]
    }
  },

  getElementStyle: {
    name: "getElementStyle",
    description: "Get computed style of an element",
    parameters: {
      type: "object", 
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for the element"
        },
        property: {
          type: "string",
          description: "CSS property name (optional, returns all if not specified)"
        }
      },
      required: ["selector"]
    }
  },

  setElementStyle: {
    name: "setElementStyle",
    description: "Set style properties of an element",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string", 
          description: "CSS selector for the element"
        },
        styles: {
          type: "object",
          description: "Object with CSS property names and values"
        }
      },
      required: ["selector", "styles"]
    }
  },

  getElementPosition: {
    name: "getElementPosition",
    description: "Get position and size of an element",
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

  hoverElement: {
    name: "hoverElement", 
    description: "Simulate hovering over an element",
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

  rightClickElement: {
    name: "rightClickElement",
    description: "Simulate right-click on an element", 
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

  dragAndDropElement: {
    name: "dragAndDropElement",
    description: "Drag an element and drop it on another element",
    parameters: {
      type: "object",
      properties: {
        sourceSelector: {
          type: "string",
          description: "CSS selector for the element to drag"
        },
        targetSelector: {
          type: "string", 
          description: "CSS selector for the drop target"
        }
      },
      required: ["sourceSelector", "targetSelector"]
    }
  },

  clearInput: {
    name: "clearInput",
    description: "Clear the value of an input field",
    parameters: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector for the input element"
        }
      },
      required: ["selector"]
    }
  }
};