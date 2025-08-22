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
    if (element.id) {
      return `#${element.id}`;
    }

    // Try unique class combination
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        const classSelector = '.' + classes.join('.');
        if (document.querySelectorAll(classSelector).length === 1) {
          return classSelector;
        }
      }
    }

    // Try data attributes
    const dataAttrs = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => `[${attr.name}="${attr.value}"]`);
    
    if (dataAttrs.length > 0) {
      const dataSelector = element.tagName.toLowerCase() + dataAttrs[0];
      if (document.querySelectorAll(dataSelector).length === 1) {
        return dataSelector;
      }
    }

    // Fallback to nth-child
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      return `${parent.tagName.toLowerCase()} > ${element.tagName.toLowerCase()}:nth-child(${index})`;
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