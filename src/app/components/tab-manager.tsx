"use client";

import React from "react";
import { Editor, type EditorData } from "./editor";
import { TabStrip } from "./tab-strip";
import { ThemeButton } from "./theme-button";

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
			type: "rename";
			index: number;
			value: T;
	  }
	| {
			type: "reorder";
			value: T[];
	  };

function tabReducer<T>(state: T[], action: TabReducerAction<T>) {
	switch (action.type) {
		case "append":
			return state.concat(action.initialValue);
		case "remove":
			return state.filter((x) => !action.predicate(x));
		case "rename": {
			const newState = [...state];
			newState[action.index] = action.value;
			return newState;
		}
		case "reorder":
			return action.value;
	}
}

export interface Tab {
	id: number;
	state: EditorData;
}

export type TabListDispatcher = React.Dispatch<TabReducerAction<Tab>>;

export function TabManager({
	tabstripClass,
	contentRowContent,
	contentRowClass,
	editorContainerClass,
	toolbarClass,
	statswidgetClass,
	editorClass,
}: {
	tabstripClass?: string;
	contentRowClass?: string;
	contentRowContent?: React.ReactNode;
	editorContainerClass?: string;
	toolbarClass?: string;
	statswidgetClass?: string;
	editorClass?: string;
}) {
	const [tabs, modifyTabs] = React.useReducer(tabReducer<Tab>, []);
	const [currentTab, setCurrentTab] = React.useState<Tab["id"]>();
	const [nextId, setNextId] = React.useState(0);
	return (
		<>
			<TabStrip
				{...{ tabs, modifyTabs, currentTab, setCurrentTab }}
				idGen={() => {
					const id = nextId;
					setNextId(id + 1);
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
							data={tab.state}
							skipRender={tab.id !== currentTab}
							className={editorContainerClass}
							toolbarClass={toolbarClass}
							statswidgetClass={statswidgetClass}
							editorClass={editorClass}
						/>
					);
				})}
			</div>
		</>
	);
}
