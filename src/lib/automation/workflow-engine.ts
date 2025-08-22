export interface WorkflowStep {
  id: string;
  type: 'click' | 'type' | 'wait' | 'navigate' | 'extract' | 'condition';
  target?: string;
  value?: string;
  condition?: string;
  nextStep?: string;
  onError?: string;
  timeout?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
}

export interface WorkflowResult {
  success: boolean;
  completedSteps: string[];
  failedStep?: string;
  error?: string;
  extractedData?: Record<string, any>;
}

export class WorkflowEngine {

  private currentStepIndex = 0;
  private variables: Record<string, any> = {};
  private extractedData: Record<string, any> = {};

  async executeWorkflow(workflow: Workflow): Promise<WorkflowResult> {
    this.currentStepIndex = 0;
    this.variables = { ...workflow.variables };
    this.extractedData = {};

    const completedSteps: string[] = [];
    
    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        this.currentStepIndex = i;
        
        const success = await this.executeStep(step);
        
        if (success) {
          completedSteps.push(step.id);
          
          // Handle conditional flow
          if (step.nextStep) {
            const nextStepIndex = workflow.steps.findIndex(s => s.id === step.nextStep);
            if (nextStepIndex !== -1) {
              i = nextStepIndex - 1; // -1 because loop will increment
            }
          }
        } else {
          // Handle error flow
          if (step.onError) {
            const errorStepIndex = workflow.steps.findIndex(s => s.id === step.onError);
            if (errorStepIndex !== -1) {
              i = errorStepIndex - 1;
              continue;
            }
          }
          
          return {
            success: false,
            completedSteps,
            failedStep: step.id,
            error: `Step ${step.id} failed`
          };
        }
      }

      return {
        success: true,
        completedSteps,
        extractedData: this.extractedData
      };
      
    } catch (error) {
      return {
        success: false,
        completedSteps,
        failedStep: workflow.steps[this.currentStepIndex]?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeStep(step: WorkflowStep): Promise<boolean> {
    const timeout = step.timeout || 5000;
    
    try {
      switch (step.type) {
        case 'click':
          return await this.executeClick(step.target!, timeout);
          
        case 'type':
          return await this.executeType(step.target!, step.value!, timeout);
          
        case 'wait':
          return await this.executeWait(parseInt(step.value!) || 1000);
          
        case 'navigate':
          return await this.executeNavigate(step.value!, timeout);
          
        case 'extract':
          return await this.executeExtract(step.target!, step.value!);
          
        case 'condition':
          return await this.executeCondition(step.condition!);
          
        default:
          console.warn(`Unknown step type: ${step.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Step ${step.id} failed:`, error);
      return false;
    }
  }

  private async executeClick(selector: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const tryClick = () => {
        const element = document.querySelector(selector) as HTMLElement;
        
        if (element && element.offsetParent !== null) {
          element.click();
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime < timeout) {
          setTimeout(tryClick, 100);
        } else {
          resolve(false);
        }
      };
      
      tryClick();
    });
  }

  private async executeType(selector: string, text: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const tryType = () => {
        const element = document.querySelector(selector) as HTMLInputElement;
        
        if (element && element.offsetParent !== null) {
          element.focus();
          element.value = this.replaceVariables(text);
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime < timeout) {
          setTimeout(tryType, 100);
        } else {
          resolve(false);
        }
      };
      
      tryType();
    });
  }

  private async executeWait(duration: number): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), duration);
    });
  }

  private async executeNavigate(url: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const targetUrl = this.replaceVariables(url);
      window.location.href = targetUrl;
      
      // Wait for navigation to complete
      setTimeout(() => {
        resolve(window.location.href.includes(targetUrl));
      }, timeout);
    });
  }

  private async executeExtract(selector: string, variableName: string): Promise<boolean> {
    const element = document.querySelector(selector);
    
    if (element) {
      const value = element.textContent?.trim() || 
                   (element as HTMLInputElement).value || 
                   element.getAttribute('href') || 
                   element.getAttribute('src');
      
      if (value) {
        this.variables[variableName] = value;
        this.extractedData[variableName] = value;
        return true;
      }
    }
    
    return false;
  }

  private async executeCondition(condition: string): Promise<boolean> {
    try {
      // Simple condition evaluation
      const processedCondition = this.replaceVariables(condition);
      
      // Basic condition patterns
      if (processedCondition.includes('exists:')) {
        const selector = processedCondition.replace('exists:', '').trim();
        return document.querySelector(selector) !== null;
      }
      
      if (processedCondition.includes('contains:')) {
        const [selector, text] = processedCondition.replace('contains:', '').split('|');
        const element = document.querySelector(selector.trim());
        return element?.textContent?.includes(text.trim()) || false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private replaceVariables(text: string): string {
    let result = text;
    
    Object.entries(this.variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    });
    
    return result;
  }

  pauseWorkflow(): void {
    // Implementation for pausing workflow
  }

  resumeWorkflow(): void {
    // Implementation for resuming workflow
  }

  stopWorkflow(): void {
    this.currentStepIndex = 0;
    this.variables = {};
    this.extractedData = {};
  }
}