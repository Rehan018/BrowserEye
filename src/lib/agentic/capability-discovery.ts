export interface Capability {
  name: string;
  description: string;
  type: 'web_service' | 'browser_api' | 'page_element' | 'user_data';
  confidence: number;
  elements?: any[];
  metadata?: any;
}

export class CapabilityDiscovery {
  async discoverCurrentCapabilities(): Promise<Capability[]> {
    const capabilities: Capability[] = [];
    
    // Discover web page capabilities
    const pageCapabilities = await this.scanCurrentPage();
    capabilities.push(...pageCapabilities);
    
    // Discover browser capabilities
    const browserCapabilities = await this.checkBrowserAPIs();
    capabilities.push(...browserCapabilities);
    
    return capabilities;
  }

  private async scanCurrentPage(): Promise<Capability[]> {
    try {
      // Get current page info
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (!currentTab?.url) return [];
      
      const capabilities: Capability[] = [];
      const url = currentTab.url;
      const domain = new URL(url).hostname;
      
      // Detect common services
      if (domain.includes('gmail.com')) {
        capabilities.push({
          name: 'gmail_web',
          description: 'Gmail web interface for email operations',
          type: 'web_service',
          confidence: 0.9,
          metadata: { service: 'gmail', url }
        });
      }
      
      if (domain.includes('calendar.google.com')) {
        capabilities.push({
          name: 'google_calendar',
          description: 'Google Calendar for scheduling and events',
          type: 'web_service',
          confidence: 0.9,
          metadata: { service: 'calendar', url }
        });
      }
      
      if (domain.includes('amazon.com') || domain.includes('ebay.com') || domain.includes('shopping')) {
        capabilities.push({
          name: 'shopping_site',
          description: 'E-commerce site for shopping operations',
          type: 'web_service',
          confidence: 0.8,
          metadata: { service: 'shopping', url, domain }
        });
      }
      
      // Generic web page capability
      capabilities.push({
        name: 'web_page',
        description: `Web page interaction on ${domain}`,
        type: 'page_element',
        confidence: 0.7,
        metadata: { url, domain, title: currentTab.title }
      });
      
      return capabilities;
    } catch (error) {
      console.error('Page scanning failed:', error);
      return [];
    }
  }

  private async checkBrowserAPIs(): Promise<Capability[]> {
    const capabilities: Capability[] = [];
    
    // Always available browser capabilities
    capabilities.push(
      {
        name: 'tab_management',
        description: 'Switch, create, and manage browser tabs',
        type: 'browser_api',
        confidence: 1.0
      },
      {
        name: 'web_navigation',
        description: 'Navigate to URLs and control browser history',
        type: 'browser_api',
        confidence: 1.0
      },
      {
        name: 'page_interaction',
        description: 'Click elements, fill forms, and interact with pages',
        type: 'browser_api',
        confidence: 1.0
      },
      {
        name: 'content_extraction',
        description: 'Extract and analyze page content',
        type: 'browser_api',
        confidence: 1.0
      }
    );
    
    return capabilities;
  }
}