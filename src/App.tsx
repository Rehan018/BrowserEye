import { useState, useEffect } from "react";
import SidebarContainer from "./components/SidebarContainer";
import SidebarHeader from "./components/SidebarHeader";
import ViewContainer from "./components/ViewContainer";
import { CommandPalette } from "./components/command-palette/CommandPalette";
import { AppSettingsProvider } from "./contexts/AppSettingsContext";
import { TabContextProvider } from "./contexts/TabContext";
import { ViewProvider } from "./contexts/ViewContext";
import { useView } from "./hooks/useView";

export type View = "chat" | "history" | "automation" | "dashboard" | "settings";

const AppContent = () => {
	const CurrentView = useView();
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

	useEffect(() => {
		const handleOpenCommandPalette = () => setCommandPaletteOpen(true);
		window.addEventListener('openCommandPalette', handleOpenCommandPalette);
		return () => window.removeEventListener('openCommandPalette', handleOpenCommandPalette);
	}, []);

	return (
		<>
			<SidebarContainer>
				<SidebarHeader />
				<ViewContainer>
					<CurrentView />
				</ViewContainer>
			</SidebarContainer>
			<CommandPalette 
				isOpen={commandPaletteOpen} 
				onClose={() => setCommandPaletteOpen(false)} 
			/>
		</>
	);
};

const App = () => {
	return (
		<AppSettingsProvider>
			<ViewProvider>
				<TabContextProvider>
					<AppContent />
					<div id="portal-root" />
				</TabContextProvider>
			</ViewProvider>
		</AppSettingsProvider>
	);
};

export default App;
