import { ElementDetector } from './automation/element-detector';
import { WorkflowEngine, type Workflow } from './automation/workflow-engine';

class AutomationContentManager {
  private elementDetector: ElementDetector;
  private workflowEngine: WorkflowEngine;

  constructor() {
    this.elementDetector = new ElementDetector();
    this.workflowEngine = new WorkflowEngine();
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.type) {
        case 'PING':
          sendResponse({ success: true, message: 'Automation content script ready' });
          break;
        case 'DETECT_ELEMENTS':
          this.handleDetectElements(sendResponse);
          break;
        case 'EXECUTE_WORKFLOW':
          this.handleExecuteWorkflow(message.workflow, sendResponse);
          break;
        case 'EXECUTE_ACTION':
          this.handleExecuteAction(message.payload, sendResponse);
          break;
        case 'FIND_ELEMENT':
          this.handleFindElement(message.description, sendResponse);
          break;
        // Advanced element interaction
        case 'GET_ELEMENT_ATTRIBUTES':
          this.handleGetElementAttributes(message.data, sendResponse);
          break;
        case 'SET_ELEMENT_ATTRIBUTES':
          this.handleSetElementAttributes(message.data, sendResponse);
          break;
        case 'GET_ELEMENT_STYLE':
          this.handleGetElementStyle(message.data, sendResponse);
          break;
        case 'SET_ELEMENT_STYLE':
          this.handleSetElementStyle(message.data, sendResponse);
          break;
        case 'GET_ELEMENT_POSITION':
          this.handleGetElementPosition(message.data, sendResponse);
          break;
        case 'HOVER_ELEMENT':
          this.handleHoverElement(message.data, sendResponse);
          break;
        case 'RIGHT_CLICK_ELEMENT':
          this.handleRightClickElement(message.data, sendResponse);
          break;
        case 'DRAG_AND_DROP_ELEMENT':
          this.handleDragAndDropElement(message.data, sendResponse);
          break;
        case 'CLEAR_INPUT':
          this.handleClearInput(message.data, sendResponse);
          break;
        // Content manipulation
        case 'EXTRACT_TABLE_DATA':
          this.handleExtractTableData(message.data, sendResponse);
          break;
        case 'EXTRACT_LINKS':
          this.handleExtractLinks(message.data, sendResponse);
          break;
        case 'READ_LOCAL_STORAGE':
          this.handleReadLocalStorage(message.data, sendResponse);
          break;
        case 'WRITE_LOCAL_STORAGE':
          this.handleWriteLocalStorage(message.data, sendResponse);
          break;
        case 'READ_SESSION_STORAGE':
          this.handleReadSessionStorage(message.data, sendResponse);
          break;
        case 'WRITE_SESSION_STORAGE':
          this.handleWriteSessionStorage(message.data, sendResponse);
          break;
        case 'GET_COOKIES':
          this.handleGetCookies(message.data, sendResponse);
          break;
        case 'SET_COOKIES':
          this.handleSetCookies(message.data, sendResponse);
          break;
        // Control flow
        case 'ELEMENT_EXISTS':
          this.handleElementExists(message.data, sendResponse);
          break;
        case 'ELEMENT_IS_VISIBLE':
          this.handleElementIsVisible(message.data, sendResponse);
          break;
        case 'WAIT_FOR_ELEMENT':
          this.handleWaitForElement(message.data, sendResponse);
          break;
        case 'EXECUTE_JAVASCRIPT':
          this.handleExecuteJavaScript(message.data, sendResponse);
          break;
      }
      return true;
    });
  }

  private handleDetectElements(sendResponse: (response: any) => void): void {
    try {
      const elements = this.elementDetector.detectInteractiveElements();
      sendResponse({ success: true, elements });
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Element detection failed' 
      });
    }
  }

  private async handleExecuteWorkflow(workflow: Workflow, sendResponse: (response: any) => void): Promise<void> {
    try {
      const result = await this.workflowEngine.executeWorkflow(workflow);
      sendResponse({ success: true, result });
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Workflow execution failed' 
      });
    }
  }

  private async handleExecuteAction(payload: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const { action, target, value } = payload;
      let result;

      switch (action) {
        case 'click':
          result = await this.clickElement(target);
          break;
        case 'type':
          result = await this.typeText(target, value);
          break;
        case 'extract':
          result = await this.extractText(target);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      sendResponse({ success: true, result });
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Action execution failed' 
      });
    }
  }

  private handleFindElement(description: string, sendResponse: (response: any) => void): void {
    try {
      const element = this.elementDetector.findElementByDescription(description);
      sendResponse({ success: true, element });
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Element search failed' 
      });
    }
  }

  private async clickElement(selector: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const element = document.querySelector(selector) as HTMLElement;
        
        if (element) {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                          window.getComputedStyle(element).visibility !== 'hidden' &&
                          window.getComputedStyle(element).display !== 'none';
          
          if (isVisible) {
            // Scroll element into view
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add visual feedback
            this.highlightElement(element);
            
            setTimeout(() => {
              try {
                element.click();
                resolve(true);
              } catch (clickError) {
                console.error('Click failed:', clickError);
                resolve(false);
              }
            }, 300);
          } else {
            console.warn(`Element not visible: ${selector}`);
            resolve(false);
          }
        } else {
          console.warn(`Element not found: ${selector}`);
          resolve(false);
        }
      } catch (error) {
        console.error(`Click element error:`, error);
        resolve(false);
      }
    });
  }

  private async typeText(selector: string, text: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
        
        if (element) {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                          window.getComputedStyle(element).visibility !== 'hidden' &&
                          window.getComputedStyle(element).display !== 'none';
          
          if (isVisible && !element.disabled && !element.readOnly) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.highlightElement(element);
            
            setTimeout(() => {
              try {
                element.focus();
                element.value = '';
                element.value = text;
                
                // Trigger multiple events for better compatibility
                element.dispatchEvent(new Event('focus', { bubbles: true }));
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                
                resolve(true);
              } catch (typeError) {
                console.error('Type failed:', typeError);
                resolve(false);
              }
            }, 300);
          } else {
            console.warn(`Element not editable: ${selector}`);
            resolve(false);
          }
        } else {
          console.warn(`Input element not found: ${selector}`);
          resolve(false);
        }
      } catch (error) {
        console.error(`Type text error:`, error);
        resolve(false);
      }
    });
  }

  private async extractText(selector: string): Promise<string | null> {
    try {
      const element = document.querySelector(selector);
      
      if (element) {
        // Highlight the element being extracted
        this.highlightElement(element as HTMLElement);
        
        let value: string | null = null;
        
        // Try different extraction methods based on element type
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          value = (element as HTMLInputElement).value;
        } else if (element.tagName === 'A') {
          value = element.getAttribute('href') || element.textContent?.trim() || null;
        } else if (element.tagName === 'IMG') {
          value = element.getAttribute('src') || element.getAttribute('alt') || null;
        } else if (element.tagName === 'SELECT') {
          const select = element as HTMLSelectElement;
          value = select.options[select.selectedIndex]?.text || select.value;
        } else {
          value = element.textContent?.trim() || element.getAttribute('data-value') || null;
        }
        
        return value && value.length > 0 ? value : null;
      }
      
      return null;
    } catch (error) {
      console.error(`Extract text error:`, error);
      return null;
    }
  }

  private highlightElement(element: HTMLElement): void {
    const originalStyle = element.style.cssText;
    
    element.style.cssText += `
      outline: 3px solid #3B82F6 !important;
      outline-offset: 2px !important;
      background-color: rgba(59, 130, 246, 0.1) !important;
      transition: all 0.3s ease !important;
    `;
    
    setTimeout(() => {
      element.style.cssText = originalStyle;
    }, 2000);
  }

  // Advanced element interaction handlers
  private handleGetElementAttributes(data: { selector: string }, sendResponse: (response: any) => void): void {
    try {
      const element = document.querySelector(data.selector);
      if (!element) {
        sendResponse({ success: false, error: 'Element not found' });
        return;
      }
      
      const attributes: Record<string, string> = {};
      for (const attr of element.attributes) {
        attributes[attr.name] = attr.value;
      }
      
      sendResponse({ success: true, attributes });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleSetElementAttributes(data: { selector: string; attributes: Record<string, string> }, sendResponse: (response: any) => void): void {
    try {
      const element = document.querySelector(data.selector);
      if (!element) {
        sendResponse({ success: false, error: 'Element not found' });
        return;
      }
      
      Object.entries(data.attributes).forEach(([name, value]) => {
        element.setAttribute(name, value);
      });
      
      sendResponse({ success: true, message: 'Attributes set successfully' });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleGetElementStyle(data: { selector: string; property?: string }, sendResponse: (response: any) => void): void {
    try {
      const element = document.querySelector(data.selector) as HTMLElement;
      if (!element) {
        sendResponse({ success: false, error: 'Element not found' });
        return;
      }
      
      const computedStyle = window.getComputedStyle(element);
      
      if (data.property) {
        const value = computedStyle.getPropertyValue(data.property);
        sendResponse({ success: true, style: { [data.property]: value } });
      } else {
        const allStyles: Record<string, string> = {};
        for (let i = 0; i < computedStyle.length; i++) {
          const prop = computedStyle[i];
          allStyles[prop] = computedStyle.getPropertyValue(prop);
        }
        sendResponse({ success: true, style: allStyles });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleSetElementStyle(data: { selector: string; styles: Record<string, string> }, sendResponse: (response: any) => void): void {
    try {
      const element = document.querySelector(data.selector) as HTMLElement;
      if (!element) {
        sendResponse({ success: false, error: 'Element not found' });
        return;
      }
      
      Object.entries(data.styles).forEach(([property, value]) => {
        element.style.setProperty(property, value);
      });
      
      sendResponse({ success: true, message: 'Styles set successfully' });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleGetElementPosition(data: { selector: string }, sendResponse: (response: any) => void): void {
    try {
      const element = document.querySelector(data.selector) as HTMLElement;
      if (!element) {
        sendResponse({ success: false, error: 'Element not found' });
        return;
      }
      
      const rect = element.getBoundingClientRect();
      const position = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom
      };
      
      sendResponse({ success: true, position });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleHoverElement(data: { selector: string }, sendResponse: (response: any) => void): void {
    try {
      const element = document.querySelector(data.selector) as HTMLElement;
      if (!element) {
        sendResponse({ success: false, error: 'Element not found' });
        return;
      }
      
      const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true, cancelable: true });
      const mouseOverEvent = new MouseEvent('mouseover', { bubbles: true, cancelable: true });
      
      element.dispatchEvent(mouseEnterEvent);
      element.dispatchEvent(mouseOverEvent);
      
      sendResponse({ success: true, message: 'Element hovered successfully' });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleRightClickElement(data: { selector: string }, sendResponse: (response: any) => void): void {
    try {
      const element = document.querySelector(data.selector) as HTMLElement;
      if (!element) {
        sendResponse({ success: false, error: 'Element not found' });
        return;
      }
      
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        button: 2
      });
      
      element.dispatchEvent(contextMenuEvent);
      
      sendResponse({ success: true, message: 'Right-click performed successfully' });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleDragAndDropElement(data: { sourceSelector: string; targetSelector: string }, sendResponse: (response: any) => void): void {
    try {
      const sourceElement = document.querySelector(data.sourceSelector) as HTMLElement;
      const targetElement = document.querySelector(data.targetSelector) as HTMLElement;
      
      if (!sourceElement || !targetElement) {
        sendResponse({ success: false, error: 'Source or target element not found' });
        return;
      }
      
      // Create drag events
      const dragStartEvent = new DragEvent('dragstart', { bubbles: true, cancelable: true });
      const dragOverEvent = new DragEvent('dragover', { bubbles: true, cancelable: true });
      const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true });
      const dragEndEvent = new DragEvent('dragend', { bubbles: true, cancelable: true });
      
      sourceElement.dispatchEvent(dragStartEvent);
      targetElement.dispatchEvent(dragOverEvent);
      targetElement.dispatchEvent(dropEvent);
      sourceElement.dispatchEvent(dragEndEvent);
      
      sendResponse({ success: true, message: 'Drag and drop performed successfully' });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleClearInput(data: { selector: string }, sendResponse: (response: any) => void): void {
    try {
      const element = document.querySelector(data.selector) as HTMLInputElement | HTMLTextAreaElement;
      if (!element) {
        sendResponse({ success: false, error: 'Input element not found' });
        return;
      }
      
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      sendResponse({ success: true, message: 'Input cleared successfully' });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  // Content manipulation handlers
  private handleExtractTableData(data: { selector: string }, sendResponse: (response: any) => void): void {
    try {
      const table = document.querySelector(data.selector) as HTMLTableElement;
      if (!table) {
        sendResponse({ success: false, error: 'Table not found' });
        return;
      }
      
      const rows = Array.from(table.rows);
      const tableData = rows.map(row => 
        Array.from(row.cells).map(cell => cell.textContent?.trim() || '')
      );
      
      sendResponse({ success: true, data: tableData });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleExtractLinks(data: { selector?: string }, sendResponse: (response: any) => void): void {
    try {
      const container = data.selector ? document.querySelector(data.selector) : document;
      if (!container) {
        sendResponse({ success: false, error: 'Container not found' });
        return;
      }
      
      const links = Array.from(container.querySelectorAll('a[href]')).map(link => ({
        href: (link as HTMLAnchorElement).href,
        text: link.textContent?.trim() || '',
        title: link.getAttribute('title') || ''
      }));
      
      sendResponse({ success: true, links });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleReadLocalStorage(data: { key?: string }, sendResponse: (response: any) => void): void {
    try {
      if (data.key) {
        const value = localStorage.getItem(data.key);
        sendResponse({ success: true, value });
      } else {
        const allData: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            allData[key] = localStorage.getItem(key) || '';
          }
        }
        sendResponse({ success: true, data: allData });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleWriteLocalStorage(data: { key: string; value: string }, sendResponse: (response: any) => void): void {
    try {
      localStorage.setItem(data.key, data.value);
      sendResponse({ success: true, message: 'Data stored successfully' });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleReadSessionStorage(data: { key?: string }, sendResponse: (response: any) => void): void {
    try {
      if (data.key) {
        const value = sessionStorage.getItem(data.key);
        sendResponse({ success: true, value });
      } else {
        const allData: Record<string, string> = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            allData[key] = sessionStorage.getItem(key) || '';
          }
        }
        sendResponse({ success: true, data: allData });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleWriteSessionStorage(data: { key: string; value: string }, sendResponse: (response: any) => void): void {
    try {
      sessionStorage.setItem(data.key, data.value);
      sendResponse({ success: true, message: 'Data stored successfully' });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleGetCookies(data: { name?: string }, sendResponse: (response: any) => void): void {
    try {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          acc[name] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);
      
      if (data.name) {
        sendResponse({ success: true, value: cookies[data.name] || null });
      } else {
        sendResponse({ success: true, cookies });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleSetCookies(data: { name: string; value: string; expires?: string }, sendResponse: (response: any) => void): void {
    try {
      let cookieString = `${data.name}=${encodeURIComponent(data.value)}`;
      if (data.expires) {
        cookieString += `; expires=${data.expires}`;
      }
      document.cookie = cookieString;
      sendResponse({ success: true, message: 'Cookie set successfully' });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  // Control flow handlers
  private handleElementExists(data: { selector: string }, sendResponse: (response: any) => void): void {
    try {
      const exists = document.querySelector(data.selector) !== null;
      sendResponse({ success: true, exists });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleElementIsVisible(data: { selector: string }, sendResponse: (response: any) => void): void {
    try {
      const element = document.querySelector(data.selector) as HTMLElement;
      if (!element) {
        sendResponse({ success: true, visible: false });
        return;
      }
      
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const visible = rect.width > 0 && rect.height > 0 && 
                     style.visibility !== 'hidden' && 
                     style.display !== 'none' &&
                     style.opacity !== '0';
      
      sendResponse({ success: true, visible });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleWaitForElement(data: { selector: string; timeout?: number }, sendResponse: (response: any) => void): void {
    const timeout = data.timeout || 10000;
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(data.selector);
      if (element) {
        sendResponse({ success: true, found: true });
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        sendResponse({ success: false, error: 'Element not found within timeout' });
        return;
      }
      
      setTimeout(checkElement, 100);
    };
    
    checkElement();
  }

  private handleExecuteJavaScript(data: { code: string }, sendResponse: (response: any) => void): void {
    try {
      const result = eval(data.code);
      sendResponse({ success: true, result });
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AutomationContentManager();
  });
} else {
  new AutomationContentManager();
}