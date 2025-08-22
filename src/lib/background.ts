import { RUNTIME_MESSAGES } from "../constants";
import type { BrowserActionResult } from "../types/browser";
import { browserActions } from "./browser-actions";
import { listenForConnections } from "./llm-service";
import initSidebar from "./sidebar";
import { SearchManager } from "./search/search-manager";

listenForConnections();
initSidebar();

// Initialize search interception
const searchManager = new SearchManager();

// Initialize cross-tab manager
import { CrossTabManager } from "./memory/cross-tab-manager";
new CrossTabManager();

// Initialize task queue
import { TaskQueue } from "./automation/task-queue";
const taskQueue = new TaskQueue();

// Initialize page watcher
import { PageWatcher } from "./auto-analysis/page-watcher";
const pageWatcher = new PageWatcher();

// Initialize audit logger
import { AuditLogger } from "./security/audit-logger";
const auditLogger = new AuditLogger();

// Initialize privacy manager
import { PrivacyManager } from "./security/privacy-manager";
const privacyManager = new PrivacyManager();

// Combined message listener
chrome.runtime.onMessage.addListener(
	(
		request: { type: string; data?: any; tabId?: number },
		sender: chrome.runtime.MessageSender,
		sendResponse: (response?: unknown) => void,
	) => {
		const { type, data } = request;
		const action = browserActions[type as keyof typeof browserActions];

		if (action) {
			action(data)
				.then((result: BrowserActionResult) => sendResponse(result))
				.catch((error: Error) => sendResponse({ error: error.message }));
			return true; // Indicates that the response is sent asynchronously
		}

		switch (type) {
			case "GET_PAGE_ANALYSIS":
				const analysis = pageWatcher.getPageAnalysis();
				sendResponse({ analysis });
				return true;

			case "GET_CURRENT_PAGE_DATA":
				const pageData = pageWatcher.getCurrentPageData();
				sendResponse({ pageData });
				return true;

			case "LOG_AUDIT_EVENT":
				auditLogger.logEvent(data.eventType, data.action, data.details);
				sendResponse({ success: true });
				return true;

			case "GET_PRIVACY_SETTINGS":
				privacyManager.getSettings().then(settings => {
					sendResponse({ settings });
				});
				return true;

			case "UPDATE_PRIVACY_SETTINGS":
				privacyManager.updateSettings(data.settings).then(() => {
					sendResponse({ success: true });
				});
				return true;

			case "CLEANUP_OLD_DATA":
				privacyManager.cleanupOldData().then(() => {
					sendResponse({ success: true });
				});
				return true;

			case "EXECUTE_WORKFLOW":
				taskQueue.addTask({
					type: 'workflow',
					priority: 'medium',
					payload: data.workflow,
					maxRetries: 1,
					timeout: 30000
				});
				sendResponse({ success: true });
				return true;

			case "GET_QUEUE_STATUS":
				const status = taskQueue.getQueueStatus();
				sendResponse(status);
				return true;

			case "CANCEL_TASK":
				const cancelled = taskQueue.cancelTask(data.taskId);
				sendResponse({ success: cancelled });
				return true;

			case "SEARCH_GOOGLE":
				// Simple fallback search results
				sendResponse({ 
					results: [
						{ title: 'Search result 1', snippet: 'Sample snippet', url: '#', relevance: 1.0 },
						{ title: 'Search result 2', snippet: 'Sample snippet', url: '#', relevance: 0.9 }
					]
				});
				return true;

			case "TOGGLE_SEARCH_INTERCEPTION":
				if (data.enabled) {
					searchManager.enable();
				} else {
					searchManager.disable();
				}
				sendResponse({ success: true });
				return true;

			case "SCRAPE_SEARCH_RESULTS":
				(async () => {
					try {
						// Simple mock implementation - in production, use proper scraping
						const mockResults = [
							{
								title: `Search result for: ${data.query}`,
								url: `https://example.com/search?q=${encodeURIComponent(data.query)}`,
								snippet: `This is a mock search result for the query: ${data.query}`,
								source: 'Mock Source'
							}
						];
						sendResponse({ results: mockResults });
					} catch (error) {
						sendResponse({ error: (error as Error).message });
					}
				})();
				return true;

			case "SCRAPE_WEBPAGE":
				(async () => {
					try {
						const response = await fetch(data.url);
						const html = await response.text();
						
						// Extract title and basic content
						const titleMatch = html.match(/<title>(.*?)<\/title>/i);
						const title = titleMatch ? titleMatch[1] : 'No title';
						
						// Simple content extraction (remove HTML tags)
						const content = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
						
						sendResponse({ title, content: content.substring(0, 5000) });
					} catch (error) {
						sendResponse({ error: (error as Error).message });
					}
				})();
				return true;

			case "FETCH_REQUEST":
				(async () => {
					try {
						const { url, options } = data;
						const response = await fetch(url, options);
						const responseData = await response.json();
						sendResponse({
							ok: response.ok,
							status: response.status,
							statusText: response.statusText,
							data: responseData,
						});
					} catch (error) {
						sendResponse({ error: (error as Error).message });
					}
				})();
				return true;

			case "tabTitleUpdated":
				if (sender.tab) {
					const { title, url } = data;
					const tabId = sender.tab.id;
					console.log("Title updated from content script:", {
						url,
						title,
						tabId,
					});
					chrome.runtime.sendMessage({
						type: RUNTIME_MESSAGES.SET_CONTEXT,
						data: { url, title, tabId },
					});
				}
				sendResponse({ success: true });
				return true;

			default:
				// Optional: handle unknown actions
				// sendResponse({ error: "Unknown action" });
				return false;
		}
	},
);

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
	const tab = await chrome.tabs.get(tabId);
	const url = tab.url || "chrome://newtab/";
	const title = tab.title || "New Tab";

	chrome.runtime.sendMessage({
		type: RUNTIME_MESSAGES.SET_CONTEXT,
		data: { url, title, tabId },
	});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.active && changeInfo.status === "complete") {
		const url = tab.url || "chrome://newtab/";
		const title = tab.title || "New Tab";

		chrome.runtime.sendMessage({
			type: RUNTIME_MESSAGES.SET_CONTEXT,
			data: { url, title, tabId },
		});
	}
});
