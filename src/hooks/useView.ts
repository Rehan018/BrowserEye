import { useViewContext } from "../contexts/ViewContext";
import Chat from "../views/Chat";
import History from "../views/History";
import Settings from "../views/Settings";
import Automation from "../views/Automation";
import Dashboard from "../views/Dashboard";

const views = {
	chat: Chat,
	history: History,
	automation: Automation,
	dashboard: Dashboard,
	settings: Settings,
};

export const useView = () => {
	const { view } = useViewContext();
	return views[view];
};
