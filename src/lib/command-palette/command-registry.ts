export interface Command {
  id: string;
  title: string;
  description: string;
  category: 'navigation' | 'automation' | 'search' | 'intelligence' | 'memory' | 'settings';
  shortcut?: string;
  icon?: string;
  action: () => void | Promise<void>;
}

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private shortcuts: Map<string, string> = new Map();

  constructor() {
    this.registerDefaultCommands();
    this.setupKeyboardListener();
  }

  private registerDefaultCommands(): void {
    const commands: Command[] = [
      {
        id: 'nav.chat',
        title: 'Go to Chat',
        description: 'Switch to chat view',
        category: 'navigation',
        shortcut: 'Ctrl+1',
        icon: '💬',
        action: () => this.setView('chat')
      },
      {
        id: 'nav.automation',
        title: 'Go to Automation',
        description: 'Switch to automation view',
        category: 'navigation',
        shortcut: 'Ctrl+3',
        icon: '🤖',
        action: () => this.setView('automation')
      },
      {
        id: 'search.toggle',
        title: 'Toggle Search Interception',
        description: 'Enable/disable AI search interception',
        category: 'search',
        shortcut: 'Ctrl+Shift+S',
        icon: '🔍',
        action: () => this.toggleSearchInterception()
      },
      {
        id: 'intelligence.highlight',
        title: 'Toggle Smart Highlighting',
        description: 'Enable/disable smart content highlighting',
        category: 'intelligence',
        shortcut: 'Ctrl+Shift+H',
        icon: '✨',
        action: () => this.toggleSmartHighlighting()
      },
      {
        id: 'memory.new-session',
        title: 'New Conversation',
        description: 'Start a new conversation session',
        category: 'memory',
        shortcut: 'Ctrl+N',
        icon: '➕',
        action: () => this.newConversation()
      }
    ];

    commands.forEach(cmd => this.registerCommand(cmd));
  }

  registerCommand(command: Command): void {
    this.commands.set(command.id, command);
    if (command.shortcut) {
      this.shortcuts.set(command.shortcut, command.id);
    }
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  searchCommands(query: string): Command[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllCommands().filter(cmd =>
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery)
    );
  }

  executeCommand(id: string): void {
    const command = this.commands.get(id);
    if (command) {
      command.action();
    }
  }

  private setupKeyboardListener(): void {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('openCommandPalette'));
        return;
      }

      const shortcut = this.getShortcutString(e);
      const commandId = this.shortcuts.get(shortcut);
      
      if (commandId) {
        e.preventDefault();
        this.executeCommand(commandId);
      }
    });
  }

  private getShortcutString(e: KeyboardEvent): string {
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    parts.push(e.key);
    return parts.join('+');
  }

  private setView(view: string): void {
    window.dispatchEvent(new CustomEvent('setView', { detail: view }));
  }

  private toggleSearchInterception(): void {
    chrome.runtime.sendMessage({ type: 'TOGGLE_SEARCH_INTERCEPTION' });
  }

  private toggleSmartHighlighting(): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_SMART_HIGHLIGHTING' });
      }
    });
  }

  private newConversation(): void {
    window.dispatchEvent(new CustomEvent('newConversation'));
  }
}