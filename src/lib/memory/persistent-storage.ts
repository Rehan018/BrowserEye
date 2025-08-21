export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tabId?: number;
  url?: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  sessions: string[];
  color: string;
}

export class PersistentStorage {
  private readonly STORAGE_KEYS = {
    CONVERSATIONS: 'browsereye_conversations',
    PROJECTS: 'browsereye_projects',
    CURRENT_SESSION: 'browsereye_current_session'
  };

  async saveConversation(session: ConversationSession): Promise<void> {
    const conversations = await this.getAllConversations();
    conversations[session.id] = session;
    
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.CONVERSATIONS]: conversations
    });
  }

  async getConversation(sessionId: string): Promise<ConversationSession | null> {
    const conversations = await this.getAllConversations();
    return conversations[sessionId] || null;
  }

  async getAllConversations(): Promise<Record<string, ConversationSession>> {
    const result = await chrome.storage.local.get([this.STORAGE_KEYS.CONVERSATIONS]);
    return result[this.STORAGE_KEYS.CONVERSATIONS] || {};
  }

  async deleteConversation(sessionId: string): Promise<void> {
    const conversations = await this.getAllConversations();
    delete conversations[sessionId];
    
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.CONVERSATIONS]: conversations
    });
  }

  async saveProject(project: Project): Promise<void> {
    const projects = await this.getAllProjects();
    projects[project.id] = project;
    
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.PROJECTS]: projects
    });
  }

  async getAllProjects(): Promise<Record<string, Project>> {
    const result = await chrome.storage.local.get([this.STORAGE_KEYS.PROJECTS]);
    return result[this.STORAGE_KEYS.PROJECTS] || {};
  }

  async setCurrentSession(sessionId: string): Promise<void> {
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.CURRENT_SESSION]: sessionId
    });
  }

  async getCurrentSession(): Promise<string | null> {
    const result = await chrome.storage.local.get([this.STORAGE_KEYS.CURRENT_SESSION]);
    return result[this.STORAGE_KEYS.CURRENT_SESSION] || null;
  }

  async searchConversations(query: string): Promise<ConversationSession[]> {
    const conversations = await this.getAllConversations();
    const results: ConversationSession[] = [];
    
    for (const session of Object.values(conversations)) {
      const matchesTitle = session.title.toLowerCase().includes(query.toLowerCase());
      const matchesContent = session.messages.some(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchesTitle || matchesContent) {
        results.push(session);
      }
    }
    
    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}