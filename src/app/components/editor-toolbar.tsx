"use client";

import React from "react";
import { ReactSortable } from "react-sortablejs";
import { unreachable } from "./util";
import type { ChainedCommands, Editor } from "@tiptap/react";
import { EditorContext } from "./editor";

export function TiptapButton({ label, action, detect, icon, ...props }: {
	label: string;
	action?: (ctx: ChainedCommands) => ChainedCommands;
	detect?: (editor: Editor) => boolean;
	icon?: React.ReactNode;
} & Omit<React.HTMLProps<HTMLButtonElement>, 'action'>) {
	const editor = React.useContext(EditorContext).editor;

	return (
		<button
			title={label}
			{...props}
			type="button"
			onClick={action ? e => {
				if(editor) action(editor.chain().focus()).run();
				props.onClick?.(e);
			} : props.onClick}
			disabled={!editor || props.disabled || !action}
			className={`toolbar-button ${editor && detect?.(editor) ? "is-active" : ""} ${props.className ?? ''}`}
		>
			{icon ?? label}
		</button>
	);
}

const TOOLS = {
	bold: <TiptapButton label="bold" action={ctx => ctx.toggleBold()} detect={ed => ed.isActive('bold')} />,
	italic: <TiptapButton label="italic" action={ctx => ctx.toggleItalic()} detect={ed => ed.isActive('italic')} />,
	fontSize: <input type="number"/>,
	/// ...
};

type ToolbarItemTypes = {
	id: keyof typeof TOOLS;
};

type ToolbarGroup = {
	id: number;
	items: ToolbarItemTypes[];
};
export type ToolbarConfig = {
	order: (Pick<ToolbarGroup, "id"> & { isGroup: true })[];
	groups: Record<ToolbarGroup["id"], ToolbarGroup>;
	nextGroupId: number;
};

function toolbarDispatch(
	state: ToolbarConfig,
	action:
		| {
				type: "rearrange";
				order: ((Pick<ToolbarGroup, "id"> & { isGroup: true }) | ToolbarItemTypes)[];
		  }
		| {
				type: "rearrange-child";
				childId: ToolbarGroup["id"];
				order: ToolbarItemTypes[];
		  },
): ToolbarConfig {
	switch (action.type) {
		case "rearrange": {
			let nextGroupId = state.nextGroupId;
			const groups = { ...state.groups };
			return {
				order: action.order.map((item) => {
					if (!("isGroup" in item)) {
						const id = nextGroupId++;
						groups[id] = {
							id: nextGroupId++,
							items: [item],
						} satisfies ToolbarGroup;
						return { id, isGroup: true };
					}
					return item;
				}),
				groups,
				nextGroupId,
			};
		}
		case "rearrange-child":
			return {
				...state,
				groups: {
					...state.groups,
					[action.childId]: {
						...state.groups[action.childId],
						items: action.order,
					},
				},
			};
		default:
			unreachable(action);
	}
}

const ToolbarConfigContext = React.createContext<{
	arrangement: React.ReducerState<typeof toolbarDispatch>;
	updateArrangement: React.Dispatch<
		React.ReducerAction<typeof toolbarDispatch>
	>;
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
}>(null!);

export function ToolbarConfigProvider(props: React.PropsWithChildren<object>) {
	/* eslint-disable react/jsx-key */

	const initGroups = [
		['bold', 'italic'],
		['fontSize'],
	] satisfies (keyof typeof TOOLS)[][]; // Example data
	const [arrangement, updateArrangement] = React.useReducer(toolbarDispatch, {
		nextGroupId: initGroups.length,
		groups: {
			...initGroups.map((els, id) => ({
				id,
				items: els.map(el => ({ id: el })),
			})),
		},
		order: new Array(initGroups.length).fill(null).map((_, i) => ({ id: i, isGroup: true })),
	} satisfies ToolbarConfig);
	return (
		<ToolbarConfigContext.Provider
			value={{ arrangement, updateArrangement }}
			{...props}
		/>
	);
}

export function EditorToolbar() {
	const { arrangement, updateArrangement } =
		React.useContext(ToolbarConfigContext);
	return (
		<ReactSortable
			list={arrangement.order}
			setList={(order) => updateArrangement({ type: "rearrange", order })}
			group={{
				name: "editor-toolbar-groups",
				put: ["editor-toolbar", "editor-toolbar-groups"],
				pull: ["editor-toolbar-groups"],
			}}
		>
			{arrangement.order.map(({ id }) => {
				const group = arrangement.groups[id];
				return (
					<ReactSortable
						key={group.id}
						group={{
							name: "editor-toolbar",
							put: ["editor-toolbar"],
							pull: ["editor-toolbar", "editor-toolbar-groups"],
						}}
						list={group.items}
						setList={(order) =>
							updateArrangement({
								type: "rearrange-child",
								childId: group.id,
								order,
							})
						}
					>
						{group.items.map((item) => {
							return React.cloneElement(TOOLS[item.id], {key: item.id});
						})}
					</ReactSortable>
				);
			})}
		</ReactSortable>
	);
}
