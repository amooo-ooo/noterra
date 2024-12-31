"use client";

import React from "react";
import { ReactSortable } from "react-sortablejs";
import { unreachable } from "@/app/util";
import type { ChainedCommands } from "@tiptap/react";
import { FontFamilySelect, TiptapButton, TiptapSelect } from "./tiptap-fields";
import styles from "@/app/styles/editor-toolbar.module.scss";

import {
	FormatBold,
	FormatItalic,
	FormatUnderline,
	FormatStrikethrough,
	FormatQuote,
	FormatLineSpacing,
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
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	Heading4Icon,
	Heading5Icon,
	Heading6Icon,
	PilcrowIcon,
	PlusIcon,
	MinusIcon,
	IndentIcon,
	IndentDecreaseIcon,
	Square,
	Table,
	WrapText,
	// ChartSpline,
	ImageIcon,
} from "lucide-react";

import { Datalist, Option, Select } from "./select";
import { ThemeContext } from "./global-listeners";
import { EditorContext } from "./editor";

const BASE_COLORS = [
	"#980000",
	"#ff0000",
	"#ff9900",
	"#ffff00",
	"#00ff00",
	"#00ffff",
	"#4a86e8",
	"#0000ff",
	"#9900ff",
	"#ff00ff",
];

const COLORS = [
	"#000000",
	"#434343",
	"#666666",
	"#999999",
	"#b7b7b7",
	"#cccccc",
	"#d9d9d9",
	"#efefef",
	"#f3f3f3",
	"#ffffff",
	...BASE_COLORS,

	// translucency-based colours
	...new Array(5)
		.fill(null)
		.flatMap((_, i) =>
			BASE_COLORS.map(
				(color) => `${color}${(Math.floor(((5 - i) / 6) * 0xff)).toString(16)}`,
			),
		),
] as const;

function TextColorSelect() {
	const { dark } = React.useContext(ThemeContext);
	return (
		<TiptapSelect
			title="Text Color"
			detect={(ed) => ed.getAttributes("textStyle").color || "#000000"}
			action={(value, ctx) => ctx.setColor(value)}
			className={`${styles["text-color"]} ${styles["toolbar-select"]} ${styles.button} ${styles["color-swatch-grid"]}`}
			display={{ type: "grid", width: 10 }}
			label={(color) => (
				<span
					className={styles["color-swatch"]}
					style={{
						backgroundColor: dark
							? `hsl(from ${color} h s calc(100 - l))`
							: color,
					}}
				/>
			)}
		>
			{COLORS.map((color) => (
				<Option
					label={
						<span
							className={styles["color-swatch"]}
							style={{
								backgroundColor: dark
									? `hsl(from ${color} h s calc(100 - l))`
									: color,
							}}
						/>
					}
					value={color}
					key={`${color}-default`}
				/>
			))}
		</TiptapSelect>
	);
}

function HighlightSelect() {
	const { dark } = React.useContext(ThemeContext);
	return (
		<TiptapSelect
			title="Highlight Color"
			detect={(ed) => ed.getAttributes("highlight").color || "transparent"}
			action={(value, ctx) =>
				value === "transparent"
					? ctx.unsetHighlight()
					: ctx.setHighlight({ color: value })
			}
			className={`${styles["highlight-color"]} ${styles["toolbar-select"]} ${styles.button} ${styles["color-swatch-grid"]}`}
			display={{ type: "grid", width: 10 }}
			label={(color) =>
				color === "transparent" ? null : (
					<span
						className={styles["color-swatch"]}
						style={{
							backgroundColor: dark
								? `hsl(from ${color} h s calc(100 - l))`
								: color,
						}}
					/>
				)
			}
		>
			{[
				...COLORS.map((color) => (
					<Option
						label={
							<span
								className={styles["color-swatch"]}
								style={{
									backgroundColor: dark
										? `hsl(from ${color} h s calc(100 - l))`
										: color,
								}}
							/>
						}
						value={color}
						key={`${color}-default`}
					/>
				)),
				<Option
					label={
						<span
							className={styles["color-swatch"]}
							style={{
								background:
									"repeating-conic-gradient(from 0deg, var(--bg-2) 0% 25%, var(--bg--1) 25% 50%)",
								backgroundSize: "8px 8px",
								backgroundPosition: "center",
							}}
						/>
					}
					value="transparent"
					key="transparent-default"
				/>,
			]}
		</TiptapSelect>
	);
}

function Spacing() {
	const { editor } = React.useContext(EditorContext);

	return (
		<Select
			label={<FormatLineSpacing />}
			title="Insert Spacing"
			onChange={(value) => {
				const action = value.startsWith("lineHeight")
					? (ctx: ChainedCommands) => {
							return value.startsWith("lineHeight")
								? ctx.setLineHeight((value.split("-")[1] as `${number}em`) ?? 0)
								: ctx.setMargins({
										[value.split("-")[0]]: value.split("-")[1],
									});
						}
					: (ctx: ChainedCommands) => ctx.setMargins({ [value]: "1em" });

				if (editor) action(editor.chain().focus()).run();
			}}
			className={`${styles["toolbar-select"]} ${styles.button}`}
		>
			{[
				...[1, 1.15, 1.5, 2, 2.5, 3].map((value) => (
					<Option label={value} value={`lineHeight-${value}em`} key={value} />
				)),
				// TODO: Actually implement margins properly
				...Object.entries({
					Before: "top",
					After: "bottom",
				}).map(([label, value]) => (
					<Option
						label={`${editor?.getAttributes("heading").textAlign ? "Remove" : "Add"} Space ${label} Paragraph`}
						// label={`Space ${label} Paragraph`}
						value={value}
						key={`${label}-${value}`}
					/>
				)),
			]}
		</Select>
	);
}

function TableSelect() {
	const { editor } = React.useContext(EditorContext);

	return (
		<Select
			label={<Table />}
			title="Insert Table"
			onChange={(value) => {
				const [cols, rows] = value.split("x").map(Number);
				editor?.chain().focus().insertTable({ rows, cols }).run();
			}}
			className={`${styles["toolbar-select"]} ${styles.button} ${styles.table}`}
			display={{ type: "grid", width: 10 }}
		>
			{Array.from({ length: 10 * 8 }, (_, i) => {
				const col = Math.floor(i / 10) + 1;
				const row = (i % 10) + 1;
				return (
					<Option
						value={`${row}x${col}`}
						key={`${row}-${col}`}
						label={<Square size={22} fontWeight={250} />}
						style={{ padding: "2px" }}
					/>
				);
			})}
		</Select>
	);
}

function getElement(node?: Node) {
	let n: Node | null = node ?? null;
	while (n && n.nodeType !== Node.ELEMENT_NODE) n = n.parentNode;
	return n as Element | null;
}

function FontSizeSelect() {
	const { editor } = React.useContext(EditorContext);

	const currentSize =
		(editor?.getAttributes("textStyle").fontSize as "" | number | undefined) ||
		Number.parseFloat(
			getComputedStyle(
				getElement(editor?.$pos(editor.state.selection.head)?.element) ??
					editor?.$doc.element ??
					document.body,
			).fontSize,
		);

	return (
		<Datalist
			title="Font Size"
			type="number"
			onChange={(value) =>
				editor
					?.chain()
					.focus()
					.setFontSize(Number.parseFloat(value || currentSize.toString()))
					.run()
			}
			value={currentSize.toString()}
			className={`${styles["toolbar-select"]} ${styles["number-select"]}`}
			preNodes={
				<button
					type="button"
					disabled={currentSize <= 1}
					onClick={() =>
						editor
							?.chain()
							.focus()
							.setFontSize(currentSize - 1)
							.run()
					}
					className={styles["toolbar-button"]}
				>
					<MinusIcon size="1.5em" />
				</button>
			}
			postNodes={
				<button
					type="button"
					onClick={() =>
						editor
							?.chain()
							.focus()
							.setFontSize(currentSize + 1)
							.run()
					}
					className={styles["toolbar-button"]}
				>
					<PlusIcon size="1.5em" />
				</button>
			}
		>
			{[6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64].map((sz) => (
				<Option
					key={sz}
					value={`${sz}`}
					label={`${sz}px`}
					disabled={currentSize === sz}
				/>
			))}
		</Datalist>
	);
}

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
	// desmosGraph: (
	// 	<TiptapButton
	// 		label="Insert Desmos Graph"
	// 		action={(ctx) =>
	// 			ctx.setDesmosGraph([
	// 				{ latex: "y = x^2" },
	// 				{ latex: "y = \\sin(x)", lineStyle: "dashed" },
	// 				{ latex: "y = 2^x" },
	// 			])
	// 		}
	// 		icon={<ChartSpline />}
	// 	/>
	// ),
	hardBreak: (
		<TiptapButton
			label="Hard Break"
			action={(ctx) => ctx.setHardBreak()}
			icon={<WrapText />}
		/>
	),
	underline: (
		<TiptapButton
			label="Underline"
			action={(ctx) => ctx.toggleUnderline()}
			detect="underline"
			icon={<FormatUnderline style={{ translate: "0 0.05em" }} />}
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
	image: (
		<TiptapButton
			label="Add Image"
			action={(ctx) =>
				ctx.setImage({
					src: "",
					alt: "Image Alt Text",
				})
			}
			icon={<ImageIcon />}
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
			icon={<FormatQuote style={{ fontVariationSettings: "'FILL' 1" }} />}
		/>
	),
	superscript: (
		<TiptapButton
			label="Superscript"
			action={(ctx) => ctx.toggleSuperscript()}
			detect="superscript"
			icon={<Superscript style={{ translate: "0 -3px" }} />}
		/>
	),
	subscript: (
		<TiptapButton
			label="Subscript"
			action={(ctx) => ctx.toggleSubscript()}
			detect="subscript"
			icon={<Subscript style={{ translate: "0 3px" }} />}
		/>
	),
	orderedList: (
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
	taskList: (
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
	indent: (
		<TiptapButton
			label="Indent"
			action={(ctx) => ctx.increaseIndent()}
			icon={<IndentIcon />}
		/>
	),
	outdent: (
		<TiptapButton
			label="Dedent"
			action={(ctx) => ctx.decreaseIndent()}
			icon={<IndentDecreaseIcon />}
		/>
	),
	undo: (
		<TiptapButton label="Undo" action={(ctx) => ctx.undo()} icon={<Undo2 />} />
	),
	redo: (
		<TiptapButton label="Redo" action={(ctx) => ctx.redo()} icon={<Redo2 />} />
	),
	fontSize: <FontSizeSelect />,
	table: <TableSelect />,
	fontFamily: <FontFamilySelect />,
	heading: (
		<TiptapSelect
			title="Text Style"
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
				<Option
					label={
						<>
							<PilcrowIcon size="1em" />
							Paragraph
						</>
					}
					value="paragraph"
					key="paragraph"
				/>,
				...[1, 2, 3, 4, 5, 6].map((level) => (
					<Option
						label={
							<>
								{
									{
										1: <Heading1Icon size="1em" />,
										2: <Heading2Icon size="1em" />,
										3: <Heading3Icon size="1em" />,
										4: <Heading4Icon size="1em" />,
										5: <Heading5Icon size="1em" />,
										6: <Heading6Icon size="1em" />,
									}[level]
								}
								{`Heading ${level}`}
							</>
						}
						value={`heading.${level}`}
						key={level}
					/>
				)),
			]}
		</TiptapSelect>
	),
	textAlign: (
		<TiptapSelect
			title="Text Align"
			detect={(ed) =>
				ed.getAttributes("paragraph").textAlign ||
				ed.getAttributes("heading").textAlign ||
				"left"
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
	textSpacing: <Spacing />,
	textColor: <TextColorSelect />,
	highlight: <HighlightSelect />,
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

type ToolbarAction =
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
	  }
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
	  };

function toolbarDispatch(
	state: ToolbarConfig,
	action: ToolbarAction,
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
	updateArrangement: React.Dispatch<ToolbarAction>;
	// biome-ignore lint/style/noNonNullAssertion: intentionally error if accessed
}>(null!);

export function ToolbarConfigProvider(props: React.PropsWithChildren<object>) {
	// TODO: sortable needs fixing: broken state when dragging across sortables
	const initGroups = [
		["undo", "redo"],
		["heading"],
		["fontFamily"],
		["fontSize"],
		[
			"bold",
			"italic",
			"underline",
			"strikethrough",
			"textColor",
			"highlight",
			"superscript",
			"subscript",
		],
		[
			"code",
			"codeblock",
			// "desmosGraph",
			"image",
			"table",
			"blockquote",
			"horizontalRule",
		],
		[
			"textAlign",
			"bulletList",
			"orderedList",
			"taskList",
			"outdent",
			"indent",
			"textSpacing",
		],
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
