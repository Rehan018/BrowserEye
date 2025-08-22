import { ContentHighlighter } from './intelligence/content-highlighter';

class IntelligenceContentManager {
  private highlighter: ContentHighlighter;
  private isHighlightingEnabled = false;

  constructor() {
    this.highlighter = new ContentHighlighter();
    this.setupMessageListener();
    this.loadSettings();
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      switch (message.type) {
        case 'ENABLE_SMART_HIGHLIGHTING':
          this.enableHighlighting();
          break;
        case 'DISABLE_SMART_HIGHLIGHTING':
          this.disableHighlighting();
          break;
        case 'GET_PAGE_CONTENT_FOR_ANALYSIS':
          this.sendPageContentForAnalysis(_sendResponse);
          break;
      }
      return true;
    });
  }

  private async loadSettings(): Promise<void> {
    const result = await chrome.storage.local.get(['smartHighlightingEnabled']);
    this.isHighlightingEnabled = result.smartHighlightingEnabled ?? false;
    
    if (this.isHighlightingEnabled) {
      this.enableHighlighting();
    }
  }

  private enableHighlighting(): void {
    this.isHighlightingEnabled = true;
    
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.applyHighlighting();
      });
    } else {
      this.applyHighlighting();
    }
  }

  private disableHighlighting(): void {
    this.isHighlightingEnabled = false;
    this.removeHighlighting();
  }

  private applyHighlighting(): void {
    // Target main content areas
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '[role="main"]',
      'body'
    ];

    let targetElement: HTMLElement | null = null;
    
    for (const selector of contentSelectors) {
      targetElement = document.querySelector(selector);
      if (targetElement) break;
    }

    if (!targetElement) {
      targetElement = document.body;
    }

    // Apply highlighting
    this.highlighter.highlightContent(targetElement);
    
    // Add custom styles if not already added
    this.addHighlightStyles();
  }

  private removeHighlighting(): void {
    this.highlighter.removeHighlights(document.body);
  }

  private addHighlightStyles(): void {
    if (document.getElementById('browsereye-highlight-styles')) return;

    const style = document.createElement('style');
    style.id = 'browsereye-highlight-styles';
    style.textContent = `
      .browsereye-highlight {
        transition: all 0.2s ease;
        cursor: help;
      }
      
      .browsereye-highlight:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      @keyframes browsereye-highlight-pulse {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
      }
      
      .browsereye-highlight.browsereye-new {
        animation: browsereye-highlight-pulse 1s ease-in-out 3;
      }
    `;
    
    document.head.appendChild(style);
  }

  private sendPageContentForAnalysis(sendResponse?: (response: any) => void): void {
    const content = this.extractPageContent();
    const url = window.location.href;
    const title = document.title;

    const data = {
      content,
      url,
      title,
      timestamp: new Date().toISOString()
    };

    if (sendResponse) {
      sendResponse({ success: true, ...data });
    } else {
      chrome.runtime.sendMessage({
        type: 'PAGE_CONTENT_EXTRACTED',
        data
      });
    }
  }

  private extractPageContent(): string {
    // Remove script and style elements
    const clonedDoc = document.cloneNode(true) as Document;
    const scripts = clonedDoc.querySelectorAll('script, style, nav, header, footer, aside');
    scripts.forEach(el => el.remove());

    // Get main content
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '[role="main"]'
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const element = clonedDoc.querySelector(selector);
      if (element) {
        content = element.textContent || '';
        break;
      }
    }

    // Fallback to body content
    if (!content) {
      content = clonedDoc.body?.textContent || '';
    }

    // Clean up whitespace
    return content.replace(/\s+/g, ' ').trim().substring(0, 10000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new IntelligenceContentManager();
  });
} else {
  new IntelligenceContentManager();
}