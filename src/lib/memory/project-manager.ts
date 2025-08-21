import { PersistentStorage, type Project, type ConversationSession } from './persistent-storage';

export class ProjectManager {
  private storage: PersistentStorage;

  constructor() {
    this.storage = new PersistentStorage();
  }

  async createProject(name: string, description: string = ''): Promise<Project> {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date(),
      sessions: [],
      color: this.generateRandomColor()
    };

    await this.storage.saveProject(project);
    return project;
  }

  async addSessionToProject(projectId: string, sessionId: string): Promise<void> {
    const projects = await this.storage.getAllProjects();
    const project = projects[projectId];
    
    if (project && !project.sessions.includes(sessionId)) {
      project.sessions.push(sessionId);
      await this.storage.saveProject(project);
    }
  }

  async getProjectSessions(projectId: string): Promise<ConversationSession[]> {
    const projects = await this.storage.getAllProjects();
    const project = projects[projectId];
    
    if (!project) return [];

    const sessions: ConversationSession[] = [];
    for (const sessionId of project.sessions) {
      const session = await this.storage.getConversation(sessionId);
      if (session) sessions.push(session);
    }

    return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getAllProjects(): Promise<Project[]> {
    const projects = await this.storage.getAllProjects();
    return Object.values(projects).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteProject(projectId: string): Promise<void> {
    const projects = await this.storage.getAllProjects();
    delete projects[projectId];
    
    await chrome.storage.local.set({
      browsereye_projects: projects
    });
  }

  private generateRandomColor(): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}