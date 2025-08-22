export interface ElementInfo {
  selector: string;
  text: string;
  type: 'button' | 'input' | 'link' | 'form' | 'text' | 'image' | 'other';
  position: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
  isClickable: boolean;
}

export class ElementDetector {
  detectInteractiveElements(): ElementInfo[] {
    const elements: ElementInfo[] = [];
    const selectors = [
      'button',
      'input[type="button"], input[type="submit"]',
      'a[href]',
      'input[type="text"], input[type="email"], input[type="password"]',
      'textarea',
      'select',
      '[role="button"]',
      '[onclick]',
      '.btn, .button'
    ];

    selectors.forEach(selector => {
      const nodeList = document.querySelectorAll(selector);
      nodeList.forEach(element => {
        const info = this.analyzeElement(element as HTMLElement);
        if (info && info.isVisible) {
          elements.push(info);
        }
      });
    });

    return elements.sort((a, b) => a.position.y - b.position.y);
  }

  private analyzeElement(element: HTMLElement): ElementInfo | null {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    if (rect.width === 0 || rect.height === 0) return null;
    if (style.display === 'none' || style.visibility === 'hidden') return null;

    const text = this.getElementText(element);
    const type = this.getElementType(element);
    const selector = this.generateSelector(element);

    return {
      selector,
      text,
      type,
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      },
      isVisible: this.isElementVisible(element),
      isClickable: this.isElementClickable(element)
    };
  }

  private getElementText(element: HTMLElement): string {
    if (element.tagName === 'INPUT') {
      const input = element as HTMLInputElement;
      return input.placeholder || input.value || input.type;
    }
    
    return element.textContent?.trim().substring(0, 100) || 
           element.getAttribute('aria-label') || 
           element.getAttribute('title') || 
           element.tagName.toLowerCase();
  }

  private getElementType(element: HTMLElement): ElementInfo['type'] {
    const tag = element.tagName.toLowerCase();
    
    if (tag === 'button' || element.getAttribute('role') === 'button') return 'button';
    if (tag === 'a') return 'link';
    if (tag === 'input') {
      const type = (element as HTMLInputElement).type;
      if (['button', 'submit'].includes(type)) return 'button';
      return 'input';
    }
    if (tag === 'textarea' || tag === 'select') return 'input';
    if (tag === 'form') return 'form';
    if (tag === 'img') return 'image';
    if (element.textContent && element.textContent.trim().length > 0) return 'text';
    
    return 'other';
  }

  private generateSelector(element: HTMLElement): string {
    // Try ID first
    if (element.id && /^[a-zA-Z][\w-]*$/.test(element.id)) {
      return `#${element.id}`;
    }

    // Try name attribute for form elements
    if (element.getAttribute('name')) {
      const name = element.getAttribute('name')!;
      const nameSelector = `${element.tagName.toLowerCase()}[name="${name}"]`;
      if (document.querySelectorAll(nameSelector).length === 1) {
        return nameSelector;
      }
    }

    // Try data-testid or similar test attributes
    const testAttrs = ['data-testid', 'data-test', 'data-cy', 'data-qa'];
    for (const attr of testAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        return `[${attr}="${value}"]`;
      }
    }

    // Try unique class combination
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.trim() && !c.includes(' '));
      if (classes.length > 0) {
        // Try single class first
        for (const cls of classes) {
          const classSelector = `.${cls}`;
          if (document.querySelectorAll(classSelector).length === 1) {
            return classSelector;
          }
        }
        
        // Try combination of classes
        const classSelector = '.' + classes.join('.');
        if (document.querySelectorAll(classSelector).length === 1) {
          return classSelector;
        }
      }
    }

    // Try aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      const ariaSelector = `${element.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`;
      if (document.querySelectorAll(ariaSelector).length === 1) {
        return ariaSelector;
      }
    }

    // Try text content for buttons and links
    if (['BUTTON', 'A'].includes(element.tagName) && element.textContent) {
      const text = element.textContent.trim();
      if (text.length > 0 && text.length < 50) {
        return `${element.tagName.toLowerCase()}[text="${text}"]`;
      }
    }

    // Fallback to nth-child with more context
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName);
      const index = siblings.indexOf(element) + 1;
      
      let parentSelector = '';
      if (parent.id) {
        parentSelector = `#${parent.id}`;
      } else if (parent.className) {
        const parentClasses = parent.className.split(' ').filter(c => c.trim())[0];
        if (parentClasses) {
          parentSelector = `.${parentClasses}`;
        }
      }
      
      if (parentSelector) {
        return `${parentSelector} > ${element.tagName.toLowerCase()}:nth-of-type(${index})`;
      }
    }

    return element.tagName.toLowerCase();
  }

  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0 && 
           rect.bottom <= window.innerHeight && 
           rect.right <= window.innerWidth;
  }

  private isElementClickable(element: HTMLElement): boolean {
    const tag = element.tagName.toLowerCase();
    const clickableTags = ['button', 'a', 'input'];
    
    return clickableTags.includes(tag) || 
           element.getAttribute('role') === 'button' ||
           element.onclick !== null ||
           element.style.cursor === 'pointer';
  }

  findElementByDescription(description: string): ElementInfo | null {
    const elements = this.detectInteractiveElements();
    const lowerDesc = description.toLowerCase();
    
    // Exact text match
    let match = elements.find(el => 
      el.text.toLowerCase().includes(lowerDesc)
    );
    
    if (match) return match;

    // Fuzzy match
    match = elements.find(el => {
      const words = lowerDesc.split(' ');
      return words.some(word => el.text.toLowerCase().includes(word));
    });

    return match || null;
  }
}