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
      const element = document.querySelector(selector) as HTMLElement;
      
      if (element && element.offsetParent !== null) {
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add visual feedback
        this.highlightElement(element);
        
        setTimeout(() => {
          element.click();
          resolve(true);
        }, 500);
      } else {
        resolve(false);
      }
    });
  }

  private async typeText(selector: string, text: string): Promise<boolean> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector) as HTMLInputElement;
      
      if (element && element.offsetParent !== null) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlightElement(element);
        
        setTimeout(() => {
          element.focus();
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          resolve(true);
        }, 500);
      } else {
        resolve(false);
      }
    });
  }

  private async extractText(selector: string): Promise<string | null> {
    const element = document.querySelector(selector);
    
    if (element) {
      return element.textContent?.trim() || 
             (element as HTMLInputElement).value || 
             element.getAttribute('href') || 
             element.getAttribute('src') || 
             null;
    }
    
    return null;
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