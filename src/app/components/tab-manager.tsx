"use client";

import React from "react";
import { Editor } from "./editor";
import { TabStrip } from "./tab-strip";
import { ThemeButton } from "./theme-button";
import { type TabData, LocalFile } from "./editor-files";
import { unreachable } from "@/app/util";
import { FilesSidebar } from "./files-sidebar";
import { Option, Select } from "./select";
import {
	CheckSquareIcon,
	EllipsisVerticalIcon,
	FilesIcon,
	SquareIcon,
} from "lucide-react";
import { SidebarController, usePages } from "./sidebar-controller";

type TabReducerAction<T> =
	| {
			type: "remove";
			predicate: (value: T) => boolean;
	  }
	| {
			type: "append";
			initialValue: T;
	  }
	| {
			type: "insert";
			index: number;
			initialValue: T;
	  }
	| {
			type: "mutate";
			index: number;
			modify: (value: T) => T;
	  }
	| {
			type: "reorder";
			value: T[];
	  };

function tabReducer(state: TabData[], action: TabReducerAction<TabData>) {
	// TODO: dont just do async race condition like
	switch (action.type) {
		case "append":
			action.initialValue.index = state.length;
			action.initialValue.saveState();
			return state.concat(action.initialValue);
		case "insert":
			(async () => {
				const editors = await LocalFile.db.openStore("editors", "readwrite");
				action.initialValue.index = action.index;
				editors.add(action.initialValue.serialize());
				for (let i = action.index; i < state.length; i++) {
					state[i].index = i + 1;
					editors.put(state[i].serialize());
				}
			})();
			return [
				...state.slice(0, action.index),
				action.initialValue,
				...state.slice(action.index),
			];
		case "remove":
			(async () => {
				const editors = await LocalFile.db.openStore("editors", "readwrite");
				let offset = 0;
				for (let i = 0; i < state.length; i++) {
					if (action.predicate(state[i])) {
						editors.delete(state[i].id);
						state[i].saveFile();
						state[i].file.setOpenFlag(false);
						offset++;
					} else if (offset) {
						state[i].index = i - offset;
						editors.put(state[i].serialize());
					}
				}
			})();
			return state.filter((x) => !action.predicate(x));
		case "mutate": {
			const newState = [...state];
			newState[action.index] = action.modify(newState[action.index]);
			newState[action.index].saveState();
			return newState;
		}
		case "reorder":
			(async () => {
				const editors = await LocalFile.db.openStore("editors", "readwrite");
				editors.clear();
				for (let i = 0; i < action.value.length; i++) {
					action.value[i].index = i;
					editors.put(action.value[i].serialize());
				}
			})();
			return action.value;
		default:
			unreachable(action);
	}
}

export type TabListDispatcher = React.Dispatch<TabReducerAction<TabData>>;

export const TabsContext = React.createContext<{
	tabs: TabData[];
	modifyTabs: TabListDispatcher;
	currentTab: TabData["id"] | undefined;
	setCurrentTab: (tab: TabData["id"] | undefined) => void;
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
}>(null!);

export function TabManager({
	tabstripClass,
	contentRowClass,
	editorContainerClass,
	toolbarClass,
	statsWidgetClass,
	editorClass,
}: {
	tabstripClass?: string;
	contentRowClass?: string;
	editorContainerClass?: string;
	toolbarClass?: string;
	statsWidgetClass?: string;
	editorClass?: string;
}) {
	const [tabs, modifyTabs] = React.useReducer(tabReducer, []);
	const [currentTab, setCurrentTab] = React.useState<TabData["id"]>();
	const [nextId, setNextId] = React.useState("0");

	const [leftSidebar, setLeftSidebar] = usePages();
	const [rightSidebar /* setRightSidebar */] = usePages();

	const [showWordCount, setShowWordCount] = React.useState(true);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	React.useEffect(() => {
		(async () => {
			const tempTabs = tabs;
			let cTab = currentTab;
			for await (const tab of LocalFile.editors()) {
				if (tempTabs.find((t) => t.id === tab.id)) continue; // TODO: O(n^2) D:
				let index = Math.floor(tempTabs.length / 2);
				let shift = index;
				while (shift) {
					shift = Math.floor(shift / 2);
					const rIndex = tempTabs[index].tryIndex;
					index += shift * (rIndex && tab.tryIndex > rIndex ? 1 : -1);
				}
				modifyTabs({
					type: "insert",
					index,
					initialValue: tab as TabData,
				});
				tempTabs.splice(index, 0, tab as TabData);
				if (!cTab) {
					cTab = tab.id;
					setCurrentTab(cTab);
				}
				// TODO: replace with better id system
				setNextId(
					`${Math.max(Number.parseInt(nextId), Number.parseInt(`0${tab.file.id}`) + 1)}`,
				);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	React.useEffect(() => {
		const cb = (e: BeforeUnloadEvent) => {
			const unsavedTab = tabs.find((tab) => tab.isDirty());
			if (unsavedTab) {
				e.preventDefault();
				setCurrentTab(unsavedTab.id);
				unsavedTab.save();
				unsavedTab.clearDirty();
			}
		};
		window.addEventListener("beforeunload", cb);
		return () => window.removeEventListener("beforeunload", cb);
	}, [tabs]);

	return (
		<TabsContext.Provider
			value={{
				tabs,
				modifyTabs,
				currentTab,
				setCurrentTab: (id) => {
					tabs.find((tab) => tab.id === currentTab)?.save();
					setCurrentTab(id);
				},
			}}
		>
			<TabStrip
				idGen={() => {
					const id = nextId;
					setNextId(`${Number.parseInt(id) + 1}`);
					return id;
				}}
				className={tabstripClass}
				atStripEnd={
					<>
						<ThemeButton size="1.5em" />
						<Select
							label={<EllipsisVerticalIcon size="1.5em" />}
							onChange={(action) => {
								switch (action) {
									case "files":
										setLeftSidebar(
											<FilesSidebar
												onClose={() => setLeftSidebar(undefined)}
											/>,
										);
										break;
									case "wordCount":
										setShowWordCount(!showWordCount);
										break;
								}
							}}
						>
							<Option
								value="files"
								label={
									<>
										<FilesIcon size="1.5em" />
										View all files
									</>
								}
								disabled={
									(leftSidebar.children[1] as React.ReactElement)?.type ===
									FilesSidebar
								}
							/>
							<Option
								value="wordCount"
								label={
									<>
										{showWordCount ? (
											<CheckSquareIcon size="1.5em" />
										) : (
											<SquareIcon size="1.5em" />
										)}
										Show word count
									</>
								}
							/>
						</Select>
					</>
				}
			/>
			<div className={contentRowClass}>
				<SidebarController pages={leftSidebar} />
				{...tabs.map((tab) => {
					return (
						<Editor
							key={tab.id}
							data={tab}
							skipRender={tab.id !== currentTab}
							className={editorContainerClass}
							toolbarClass={toolbarClass}
							statsWidgetClass={statsWidgetClass}
							editorClass={editorClass}
							wordCount={showWordCount}
						/>
					);
				})}
				<SidebarController pages={rightSidebar} right />
			</div>
		</TabsContext.Provider>
	);
}
