import { useState, useEffect } from 'react';
import { SessionManager } from '../lib/memory/session-manager';
import { ProjectManager } from '../lib/memory/project-manager';
import { CrossTabManager } from '../lib/memory/cross-tab-manager';
import type { ConversationSession, Project } from '../lib/memory/persistent-storage';
import type { TabContext } from '../lib/memory/cross-tab-manager';

export const useMemorySystem = () => {
  const [sessionManager] = useState(() => new SessionManager());
  const [projectManager] = useState(() => new ProjectManager());
  const [crossTabManager] = useState(() => new CrossTabManager());
  
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<ConversationSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tabContexts, setTabContexts] = useState<TabContext[]>([]);

  useEffect(() => {
    // Initialize current session
    const initSession = sessionManager.getCurrentSession();
    setCurrentSession(initSession);

    // Load recent sessions
    sessionManager.getRecentSessions(10).then(setRecentSessions);

    // Load projects
    projectManager.getAllProjects().then(setProjects);

    // Setup listeners
    sessionManager.onSessionChange((session) => {
      setCurrentSession(session);
      // Refresh recent sessions
      sessionManager.getRecentSessions(10).then(setRecentSessions);
    });

    crossTabManager.onContextChange(setTabContexts);

    // Get initial tab contexts
    setTabContexts(crossTabManager.getAllTabContexts());
  }, [sessionManager, projectManager, crossTabManager]);

  const createNewSession = async (title?: string, projectId?: string) => {
    const session = await sessionManager.createNewSession(title, projectId);
    
    // Associate with current tab if available
    const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab[0]?.id) {
      await crossTabManager.associateSessionWithTab(currentTab[0].id, session.id);
    }
    
    return session;
  };

  const addMessageToSession = async (content: string, role: 'user' | 'assistant' | 'system') => {
    const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await sessionManager.addMessage({
      role,
      content,
      tabId: currentTab[0]?.id,
      url: currentTab[0]?.url
    });
  };

  const switchToSession = async (sessionId: string) => {
    const session = await sessionManager.switchToSession(sessionId);
    
    // Try to switch to the tab associated with this session
    await crossTabManager.switchToTabWithSession(sessionId);
    
    return session;
  };

  const createProject = async (name: string, description?: string) => {
    const project = await projectManager.createProject(name, description || '');
    setProjects(prev => [project, ...prev]);
    return project;
  };

  const searchSessions = async (query: string) => {
    return await sessionManager.searchSessions(query);
  };

  return {
    // Current state
    currentSession,
    recentSessions,
    projects,
    tabContexts,
    
    // Session management
    createNewSession,
    addMessageToSession,
    switchToSession,
    searchSessions,
    
    // Project management
    createProject,
    
    // Managers (for advanced usage)
    sessionManager,
    projectManager,
    crossTabManager
  };
};