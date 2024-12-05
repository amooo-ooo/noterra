"use client";

import React from "react";
import { Editor, type EditorData } from "./editor";
import { TabStrip } from "./tab-strip";

function tabReducer<T>(
	state: T[],
	action:
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
		  },
) {
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

export type TabListDispatcher = React.Dispatch<
	React.ReducerAction<typeof tabReducer<Tab>>
>;

export function TabManager({
	tabstripClass,
	toolbarClass,
	editorClass,
}: { tabstripClass?: string; toolbarClass?: string; editorClass?: string }) {
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
			/>
			{...tabs.map((tab) => {
				return (
					<Editor
						key={tab.id}
						data={tab.state}
						skipRender={tab.id !== currentTab}
						toolbarClass={toolbarClass}
						editorClass={editorClass}
					/>
				);
			})}
		</>
	);
}
