"use client";

import React from "react";
import { ReactSortable } from "react-sortablejs";
import { unreachable } from "./util";
import { TiptapButton, TiptapSelect } from "./tiptap-fields";
import styles from "@/app/styles/editor-toolbar.module.css";

import {
	FormatBold,
	FormatItalic,
	FormatUnderline,
	FormatStrikethrough,
	Code,
	CodeBlocks,
	Superscript,
	Subscript,
	FormatListNumbered,
	Undo,
	Redo,
	FormatListBulleted,
	HorizontalRule,
	FormatQuote,
} from "./icons";
import { Option } from "./select";

const TOOLS = {
	bold: (
		<TiptapButton
			label="bold"
			action={(ctx) => ctx.toggleBold()}
			detect="bold"
			icon={<FormatBold />}
		/>
	),
	italic: (
		<TiptapButton
			label="italic"
			action={(ctx) => ctx.toggleItalic()}
			detect="italic"
			icon={<FormatItalic />}
		/>
	),
	underline: (
		<TiptapButton
			label="underline"
			action={(ctx) => ctx.toggleUnderline()}
			detect="underline"
			icon={<FormatUnderline />}
		/>
	),
	strikethrough: (
		<TiptapButton
			label="strikethrough"
			action={(ctx) => ctx.toggleStrike()}
			detect="strike"
			icon={<FormatStrikethrough />}
		/>
	),
	code: (
		<TiptapButton
			label="code"
			action={(ctx) => ctx.toggleCode()}
			detect="code"
			icon={<Code />}
		/>
	),
	codeblock: (
		<TiptapButton
			label="codeblock"
			action={(ctx) => ctx.toggleCodeBlock()}
			detect="codeblock"
			icon={<CodeBlocks />}
		/>
	),
	blockquote: (
		<TiptapButton
			label="blockquote"
			action={(ctx) => ctx.toggleBlockquote()}
			detect="blockquote"
			icon={<FormatQuote />}
		/>
	),
	superscript: (
		<TiptapButton
			label="superscript"
			action={(ctx) => ctx.toggleSuperscript()}
			detect="superscript"
			icon={<Superscript />}
		/>
	),
	subscript: (
		<TiptapButton
			label="subscript"
			action={(ctx) => ctx.toggleSubscript()}
			detect="subscript"
			icon={<Subscript />}
		/>
	),
	orderedlist: (
		<TiptapButton
			label="orderedlist"
			action={(ctx) => ctx.toggleOrderedList()}
			detect="orderedList"
			icon={<FormatListNumbered />}
		/>
	),
	bulletList: (
		<TiptapButton
			label="bulletList"
			action={(ctx) => ctx.toggleBulletList()}
			detect="bulletList"
			icon={<FormatListBulleted />}
		/>
	),
	horizontalRule: (
		<TiptapButton
			label="horizontalRule"
			action={(ctx) => ctx.setHorizontalRule()}
			icon={<HorizontalRule />}
		/>
	),
	undo: (
		<TiptapButton
			label="undo"
			action={(ctx) => ctx.undo()}
			disabled={(ed) => !ed.can().undo()}
			icon={<Undo />}
		/>
	),
	redo: (
		<TiptapButton
			label="redo"
			action={(ctx) => ctx.redo()}
			disabled={(ed) => !ed.can().redo()}
			icon={<Redo />}
		/>
	),
	fontSize: <input type="number" />,
	fontFamily: (
		<TiptapSelect
			label="fontFamily"
			detect={(ed) => ed.getAttributes("textStyle").fontFamily ?? "Inter"}
			action={(value, ctx) => ctx.setFontFamily(value)}
		>
			{[
				["Inter", "var(--font-inter-sans), sans-serif"],
				["Comic Sans", "'Comic Sans MS', cursive, sans-serif"],
				["Arial", "Arial, Helvetica, sans-serif"],
				["Georgia", "Georgia, serif"],
				["Times New Roman", "'Times New Roman', Times, serif"],
				["Courier New", "'Courier New', Courier, monospace"],
				["Verdana", "Verdana, Geneva, sans-serif"],
				["Tahoma", "Tahoma, Geneva, sans-serif"],
				["Trebuchet MS", "'Trebuchet MS', Helvetica, sans-serif"],
				["Lucida Sans", "'Lucida Sans', 'Lucida Grande', sans-serif"]
			].map(([font, src]) => (
				<Option 
					label={font} 
					value={src} 
					key={font} 
					style={{ fontFamily: src }} 
				/>
			))}
		</TiptapSelect>
	),
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
			order: (
				| (Pick<ToolbarGroup, "id"> & { isGroup: true })
				| ToolbarItemTypes
			)[];
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
	// biome-ignore lint/style/noNonNullAssertion: intentionally error if accessed
}>(null!);

export function ToolbarConfigProvider(props: React.PropsWithChildren<object>) {
	// TODO: sortable needs fixing: broken state when dragging across sortables
	const initGroups = [
		[
			"undo",
			"redo"
		],
		["fontFamily"],
		[
			"bold",
			"italic",
			"underline",
			"strikethrough",
			"superscript",
			"subscript",
			"code",
		],
		[
			"codeblock",
			"blockquote",
			"bulletList",
			"orderedlist",
			"horizontalRule",
		],
		["fontSize"],
	] satisfies (keyof typeof TOOLS)[][];
	const [arrangement, updateArrangement] = React.useReducer(toolbarDispatch, {
		nextGroupId: initGroups.length,
		groups: {
			...initGroups.map((els, id) => ({
				id,
				items: els.map((el) => ({ id: el })),
			})),
		},
		order: new Array(initGroups.length)
			.fill(null)
			.map((_, i) => ({ id: i, isGroup: true })),
	} satisfies ToolbarConfig);
	return (
		<ToolbarConfigContext.Provider
			value={{ arrangement, updateArrangement }}
			{...props}
		/>
	);
}

export function EditorToolbar({ className }: { className?: string }) {
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
			className={`${styles.toolbar} ${className}`}
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
						className={styles["toolbar-group"]}
					>
						{group.items.map((item) => {
							return React.cloneElement(TOOLS[item.id], { key: item.id });
						})}
					</ReactSortable>
				);
			})}
		</ReactSortable>
	);
}
