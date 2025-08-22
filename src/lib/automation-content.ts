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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AutomationContentManager();
  });
} else {
  new AutomationContentManager();
}