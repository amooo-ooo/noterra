"use client";

import React from "react";
import { ReactSortable } from "react-sortablejs";
import { unreachable } from "./util";
import { FontFamilySelect, TiptapButton, TiptapSelect } from "./tiptap-fields";
import styles from "@/app/styles/editor-toolbar.module.css";

import {
	FormatBold,
	FormatItalic,
	FormatUnderline,
	FormatStrikethrough,
	FormatQuote,
} from "./icons";

import {
	Code,
	SquareCode,
	List,
	Undo2,
	Redo2,
	ListOrdered,
	Minus,
	Superscript,
	Subscript,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	ListCheck,
} from "lucide-react";

import { Option } from "./select";

const COLORS = [
	"#000000", "#434343", "#999999", "#b7b7b7", "#cccccc", "#efefef", "#f3f3f3", "#ffffff",
	"#932c19", "#d02700", "#f34e16", "#fbd745", "#3df3c2", "#271ecf", "#5f01cb", "#fe4564",
	"#b3291f", "#ff4632", "#feb22d", "#dff05d", "#9cf0e1", "#7783e5", "#905ccc", "#f137a6",
];

const TOOLS = {
	bold: (
		<TiptapButton
			label="Bold"
			action={(ctx) => ctx.toggleBold()}
			detect="bold"
			icon={<FormatBold />}
		/>
	),
	italic: (
		<TiptapButton
			label="Italic"
			action={(ctx) => ctx.toggleItalic()}
			detect="italic"
			icon={<FormatItalic />}
		/>
	),
	underline: (
		<TiptapButton
			label="Underline"
			action={(ctx) => ctx.toggleUnderline()}
			detect="underline"
			icon={<FormatUnderline />}
		/>
	),
	strikethrough: (
		<TiptapButton
			label="Strikethrough"
			action={(ctx) => ctx.toggleStrike()}
			detect="strike"
			icon={<FormatStrikethrough />}
		/>
	),
	code: (
		<TiptapButton
			label="Code"
			action={(ctx) => ctx.toggleCode()}
			detect="code"
			icon={<Code />}
		/>
	),
	codeblock: (
		<TiptapButton
			label="Code Block"
			action={(ctx) => ctx.toggleCodeBlock()}
			detect="codeblock"
			icon={<SquareCode />}
		/>
	),
	blockquote: (
		<TiptapButton
			label="Block Quote"
			action={(ctx) => ctx.toggleBlockquote()}
			detect="blockquote"
			icon={<FormatQuote style={{ fontVariationSettings: "'FILL' 1"}}/>}
		/>
	),
	superscript: (
		<TiptapButton
			label="Superscript"
			action={(ctx) => ctx.toggleSuperscript()}
			detect="superscript"
			icon={<Superscript />}
		/>
	),
	subscript: (
		<TiptapButton
			label="Subscript"
			action={(ctx) => ctx.toggleSubscript()}
			detect="subscript"
			icon={<Subscript />}
		/>
	),
	orderedlist: (
		<TiptapButton
			label="Ordered list"
			action={(ctx) => ctx.toggleOrderedList()}
			detect="orderedList"
			icon={<ListOrdered />}
		/>
	),
	bulletList: (
		<TiptapButton
			label="Bullet List"
			action={(ctx) => ctx.toggleBulletList()}
			detect="bulletList"
			icon={<List />}
		/>
	),
	tasklist: (
		<TiptapButton
			label="Task List"
			action={(ctx) => ctx.toggleTaskList()}
			detect="taskList"
			icon={<ListCheck />}
		/>
	),
	horizontalRule: (
		<TiptapButton
			label="Horizontal Rule"
			action={(ctx) => ctx.setHorizontalRule()}
			icon={<Minus />}
		/>
	),
	undo: (
		<TiptapButton label="Undo" action={(ctx) => ctx.undo()} icon={<Undo2 />} />
	),
	redo: (
		<TiptapButton label="Redo" action={(ctx) => ctx.redo()} icon={<Redo2 />} />
	),
	fontSize: <input type="number" />,
	fontFamily: <FontFamilySelect />,
	heading: (
		<TiptapSelect
			label="heading"
			detect={(ed) =>
				ed.getAttributes("heading").level
					? `heading.${ed.getAttributes("heading").level}`
					: "paragraph"
			}
			action={(value, ctx) =>
				value.startsWith("heading")
					? ctx.setHeading({
						level: Number.parseInt(value.split(".")[1] ?? 1) as
							| 1
							| 2
							| 3
							| 4
							| 5
							| 6,
					})
					: ctx.setParagraph()
			}
		>
			{[
				<Option label="Paragraph" value="paragraph" key="paragraph" />,
				...[1, 2, 3, 4, 5, 6].map((level) => (
					<Option
						label={`Heading ${level}`}
						value={`heading.${level}`}
						key={level}
					/>
				)),
			]}
		</TiptapSelect>
	),
	textAlign: (
		<TiptapSelect
			label="Text Align"
			detect={(ed) =>
				ed.getAttributes("paragraph").textAlign
				?? ed.getAttributes("heading").textAlign
				?? <AlignLeft />
			}
			action={(value, ctx) => ctx.setTextAlign(value)}
			className={`${styles["toolbar-select"]} ${styles.button}`}
			display="horizontal"
		>
			{Object.entries({
				left: <AlignLeft />,
				center: <AlignCenter />,
				right: <AlignRight />,
				justify: <AlignJustify />,
			}).map(([pos, icon]) => (
				<Option label={icon} value={pos} key={pos} />
			))}
		</TiptapSelect>
	),
	textColor: (
		<TiptapSelect
			label="Text Color"
			detect={(ed) =>
				ed.getAttributes("textStyle").color
				?? (<span 
						className={styles["color-swatch"]}
						style={{ backgroundColor: "#000", borderRadius: "50%" }} 
					/>)
			}
			action={(value, ctx) => ctx.setColor(value)}
			className={`${styles["toolbar-select"]} ${styles.button} ${styles["color-swatch-grid"]}`}
			display="grid"
		>
			{
				COLORS.map((color, index) => (
					<Option
						label={<span
							className={styles["color-swatch"]}
							style={{ backgroundColor: color, borderRadius: "50%" }} />}
						value={color}
						key={`textColor-${color}-${index}`}
					/>)
				)
			}
		</TiptapSelect>
	),
	highlight: (
		<TiptapSelect
			label="Text Color"
			detect={(ed) =>
				ed.getAttributes("highlight").color
				?? (<span 
						className={styles["color-swatch"]}
						style={{ backgroundColor: "#000", borderRadius: "50%" }} 
					/>)
			}
			action={(value, ctx) => ctx.setHighlight({ color: value})}
			className={`${styles["toolbar-select"]} ${styles.button} ${styles["color-swatch-grid"]}`}
			display="grid"
		>
			{
				COLORS.map((color, index) => (
					<Option
						label={<span
							className={styles["color-swatch"]}
							style={{ backgroundColor: color, borderRadius: "50%" }} />}
						value={color}
						key={`highlight-${color}-${index}`}
					/>)
				)
			}
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
		["undo", "redo"],
		["heading"],
		["fontFamily"],
		[
			"bold",
			"italic",
			"underline",
			"strikethrough",
			"superscript",
			"subscript",
			"textColor",
			"highlight",
			"code",
		],
		[
			"codeblock",
			"blockquote",
			"textAlign",
			"bulletList",
			"orderedlist",
			"tasklist",
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
