import { PersistentStorage, type ConversationSession, type ConversationMessage } from './persistent-storage';

export class SessionManager {
  private storage: PersistentStorage;
  private currentSession: ConversationSession | null = null;
  private sessionListeners: ((session: ConversationSession) => void)[] = [];

  constructor() {
    this.storage = new PersistentStorage();
    this.initializeSession();
  }

  private async initializeSession(): Promise<void> {
    const currentSessionId = await this.storage.getCurrentSession();
    if (currentSessionId) {
      this.currentSession = await this.storage.getConversation(currentSessionId);
    }
  }

  async createNewSession(title?: string, projectId?: string): Promise<ConversationSession> {
    const session: ConversationSession = {
      id: crypto.randomUUID(),
      title: title || `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId,
      tags: []
    };

    await this.storage.saveConversation(session);
    await this.storage.setCurrentSession(session.id);
    
    this.currentSession = session;
    this.notifySessionListeners(session);
    
    return session;
  }

  async addMessage(message: Omit<ConversationMessage, 'id' | 'timestamp'>): Promise<void> {
    if (!this.currentSession) {
      await this.createNewSession();
    }

    const fullMessage: ConversationMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.currentSession!.messages.push(fullMessage);
    this.currentSession!.updatedAt = new Date();

    // Auto-generate title from first user message
    if (this.currentSession!.messages.length === 1 && message.role === 'user') {
      this.currentSession!.title = message.content.substring(0, 50) + '...';
    }

    await this.storage.saveConversation(this.currentSession!);
    this.notifySessionListeners(this.currentSession!);
  }

  async switchToSession(sessionId: string): Promise<ConversationSession | null> {
    const session = await this.storage.getConversation(sessionId);
    if (session) {
      this.currentSession = session;
      await this.storage.setCurrentSession(sessionId);
      this.notifySessionListeners(session);
    }
    return session;
  }

  getCurrentSession(): ConversationSession | null {
    return this.currentSession;
  }

  async getRecentSessions(limit: number = 10): Promise<ConversationSession[]> {
    const conversations = await this.storage.getAllConversations();
    return Object.values(conversations)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  async searchSessions(query: string): Promise<ConversationSession[]> {
    return await this.storage.searchConversations(query);
  }

  onSessionChange(listener: (session: ConversationSession) => void): void {
    this.sessionListeners.push(listener);
  }

  private notifySessionListeners(session: ConversationSession): void {
    this.sessionListeners.forEach(listener => listener(session));
  }
}