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

function tabReducer<T>(state: T[], action: TabReducerAction<T>) {
	switch (action.type) {
		case "append":
			return state.concat(action.initialValue);
		case "insert":
			return [
				...state.slice(0, action.index),
				action.initialValue,
				...state.slice(action.index + 1),
			];
		case "remove":
			return state.filter((x) => !action.predicate(x));
		case "mutate": {
			const newState = [...state];
			newState[action.index] = action.modify(newState[action.index]);
			return newState;
		}
		case "reorder":
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
	const [tabs, modifyTabs] = React.useReducer(tabReducer<TabData>, []);
	const [currentTab, setCurrentTab] = React.useState<TabData["id"]>();
	const [nextId, setNextId] = React.useState("0");

	React.useEffect(() => {
		(async () => {
			for await (const tab of LocalFile.editors()) {
				let index = Math.round(tabs.length / 2);
				let shift = index;
				while (shift) {
					shift = Math.round(shift / 2);
					const rIndex = tabs[index].tryIndex;
					index += shift * (rIndex && tab.tryIndex > rIndex ? 1 : -1);
				}
				modifyTabs({
					type: "insert",
					index,
					initialValue: tab,
				});
				// TODO: replace with better id system
				setNextId(
					`${Math.max(Number.parseInt(nextId), Number.parseInt(`0${tab.file.id}`) + 1)}`,
				);
			}
		})();
	});

	return (
		<>
			<TabStrip
				{...{ tabs, modifyTabs, currentTab, setCurrentTab }}
				idGen={() => {
					const id = nextId;
					setNextId(id + 1);
					return `${id}`;
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
