const sendMessageToBackground = (message: {
  type: string;
  data?: unknown;
}): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      if (response?.error) {
        return reject(new Error(response.error));
      }
      resolve(response);
    });
  });
};

export const advancedBrowserHandlers = {
  getElementAttributes: async (args: { selector: string }) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GET_ELEMENT_ATTRIBUTES',
          data: args
        });
      }
    } catch (error) {
      return await sendMessageToBackground({ type: 'GET_ELEMENT_ATTRIBUTES', data: args });
    }
  },

  setElementAttributes: async (args: { selector: string; attributes: Record<string, string> }) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SET_ELEMENT_ATTRIBUTES', 
          data: args
        });
      }
    } catch (error) {
      return await sendMessageToBackground({ type: 'SET_ELEMENT_ATTRIBUTES', data: args });
    }
  },

  getElementStyle: async (args: { selector: string; property?: string }) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GET_ELEMENT_STYLE',
          data: args
        });
      }
    } catch (error) {
      return await sendMessageToBackground({ type: 'GET_ELEMENT_STYLE', data: args });
    }
  },

  setElementStyle: async (args: { selector: string; styles: Record<string, string> }) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SET_ELEMENT_STYLE',
          data: args
        });
      }
    } catch (error) {
      return await sendMessageToBackground({ type: 'SET_ELEMENT_STYLE', data: args });
    }
  },

  getElementPosition: async (args: { selector: string }) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GET_ELEMENT_POSITION',
          data: args
        });
      }
    } catch (error) {
      return await sendMessageToBackground({ type: 'GET_ELEMENT_POSITION', data: args });
    }
  },

  hoverElement: async (args: { selector: string }) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'HOVER_ELEMENT',
          data: args
        });
      }
    } catch (error) {
      return await sendMessageToBackground({ type: 'HOVER_ELEMENT', data: args });
    }
  },

  rightClickElement: async (args: { selector: string }) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'RIGHT_CLICK_ELEMENT',
          data: args
        });
      }
    } catch (error) {
      return await sendMessageToBackground({ type: 'RIGHT_CLICK_ELEMENT', data: args });
    }
  },

  dragAndDropElement: async (args: { sourceSelector: string; targetSelector: string }) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'DRAG_AND_DROP_ELEMENT',
          data: args
        });
      }
    } catch (error) {
      return await sendMessageToBackground({ type: 'DRAG_AND_DROP_ELEMENT', data: args });
    }
  },

  clearInput: async (args: { selector: string }) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'CLEAR_INPUT',
          data: args
        });
      }
    } catch (error) {
      return await sendMessageToBackground({ type: 'CLEAR_INPUT', data: args });
    }
  }
};