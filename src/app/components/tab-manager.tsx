"use client";

import React from "react";
import { Editor } from "./editor";
import { TabStrip } from "./tab-strip";
import { ThemeButton } from "./theme-button";
import { type TabData, type File, LocalFile } from "./editor-files";
import { unreachable } from "./util";

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
			(async () => {
				const editors = await LocalFile.db.openStore("editors", "readwrite");
				editors.add(action.initialValue.serialize(state.length));
			})();
			return state.concat(action.initialValue);
		case "insert":
			(async () => {
				const editors = await LocalFile.db.openStore("editors", "readwrite");
				editors.add(action.initialValue.serialize(action.index));
				for (let i = action.index; i < state.length; i++) {
					editors.put(state[i].serialize(i + 1));
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
						state[i].file.save();
						offset++;
					} else if (offset) {
						editors.put(state[i].serialize(i - offset));
					}
				}
			})();
			return state.filter((x) => !action.predicate(x));
		case "mutate": {
			const newState = [...state];
			newState[action.index] = action.modify(newState[action.index]);
			(async () => {
				const editors = await LocalFile.db.openStore("editors", "readwrite");
				editors.put(newState[action.index].serialize(action.index));
			})();
			return newState;
		}
		case "reorder":
			(async () => {
				const editors = await LocalFile.db.openStore("editors", "readwrite");
				editors.clear();
				for (let i = 0; i < action.value.length; i++) {
					editors.put(action.value[i].serialize(i));
				}
			})();
			return action.value;
		default:
			unreachable(action);
	}
}

export type TabListDispatcher = React.Dispatch<TabReducerAction<TabData>>;

export function TabManager({
	tabstripClass,
	contentRowContent,
	contentRowClass,
	editorContainerClass,
	toolbarClass,
	statsWidgetClass,
	editorClass,
}: {
	tabstripClass?: string;
	contentRowClass?: string;
	contentRowContent?: React.ReactNode;
	editorContainerClass?: string;
	toolbarClass?: string;
	statsWidgetClass?: string;
	editorClass?: string;
}) {
	const [tabs, modifyTabs] = React.useReducer(tabReducer, []);
	const [currentTab, setCurrentTab] = React.useState<TabData["id"]>();
	const [nextId, setNextId] = React.useState("0");

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	React.useEffect(() => {
		(async () => {
			const tempTabs = tabs;
			for await (const tab of LocalFile.editors()) {
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
					initialValue: tab,
				});
				tempTabs.splice(index, 0, tab);
				// TODO: replace with better id system
				setNextId(
					`${Math.max(Number.parseInt(nextId), Number.parseInt(`0${tab.file.id}`) + 1)}`,
				);
			}
		})();
	}, []);

	return (
		<>
			<TabStrip
				{...{ tabs, modifyTabs, currentTab, setCurrentTab }}
				idGen={() => {
					const id = nextId;
					setNextId(`${Number.parseInt(id) + 1}`);
					return id;
				}}
				className={tabstripClass}
				atStripEnd={<ThemeButton size="1.5em" />}
			/>
			<div className={contentRowClass}>
				{contentRowContent}
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
						/>
					);
				})}
			</div>
		</>
	);
}
