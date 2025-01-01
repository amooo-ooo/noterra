import { EditorContent, useEditor } from "@tiptap/react";
import React, { useEffect } from "react";
import { EditorToolbar } from "./editor-toolbar";
import { EditorStatsWidget } from "./editor-statswidget";
import { Selection } from "@tiptap/pm/state";

import Text from "@tiptap/extension-text";
import ListItem from "@tiptap/extension-list-item";
import Paragraph from "@tiptap/extension-paragraph";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Underline from "@tiptap/extension-underline";
import Code from "@tiptap/extension-code";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import History from "@tiptap/extension-history";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Typography from "@tiptap/extension-typography";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import ListKeymap from "@tiptap/extension-list-keymap";
import MathExtension from "@aarkue/tiptap-math-extension";

import { MonacoCodeBlockExtention } from "@/app/editor-extensions/monaco-node-extension";
import { Indent } from "@/app/editor-extensions/indent";
import { BetterHighlight } from "@/app/editor-extensions/better-highlight";
import { FontSize } from "@/app/editor-extensions/font-size";
import {
	MaybePagedDocument,
	PageNode,
} from "@/app/editor-extensions/page-node";
import { DesmosGraphExtension } from "@/app/editor-extensions/desmos-node-extension";
import { BetterLinks } from "@/app/editor-extensions/better-links";
import { BlobImages } from "@/app/editor-extensions/blob-imgs";
import { Spacing } from "@/app/editor-extensions/spacing-extension";
import {
	RubyA11y,
	RubyAnnotation,
	RubyRoot,
} from "@/app/editor-extensions/ruby-nodes";
import { SelCharCount } from "@/app/editor-extensions/char-count";
import { BetterColor } from "@/app/editor-extensions/better-colors";
import { SVGExtension } from "@/app/editor-extensions/svg-image";
import { DebugFallbackRenderer } from "@/app/editor-extensions/debug-fallback-renderer";

import type { TabData } from "./editor-files";

import "@/app/styles/tiptap.scss";
import "katex/dist/katex.min.css";
import { ScrollProvider } from "./global-listeners";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export const EditorContext = React.createContext<TabData>(null!);

export const HANDLES_CHARS = "consume-input-events";

export function Editor({
	data,
	skipRender = false,
	className,
	toolbarClass,
	statsWidgetClass,
	editorClass = "",
	wordCount = false,
}: {
	data: TabData;
	skipRender?: boolean;
	className?: string;
	toolbarClass?: string;
	statsWidgetClass?: string;
	editorClass?: string;
	wordCount?: boolean;
}) {
	const editor = useEditor({
		extensions: [
			MaybePagedDocument,
			PageNode,
			Gapcursor,
			Text,
			ListItem,
			Paragraph,
			Bold,
			Italic,
			Strike,
			Underline,
			Subscript,
			Superscript,
			Code.configure({
				HTMLAttributes: {
					spellcheck: false,
				},
			}),
			BulletList,
			OrderedList,
			History,
			HorizontalRule,
			BetterLinks,
			Typography,
			Blockquote,
			MonacoCodeBlockExtention.configure({
				options: {
					scrollbar: {
						vertical: "hidden",
					},
					minimap: {
						enabled: false,
					},
					theme: "vs-dark",
				},
			}),
			FontFamily,
			TextStyle,
			Heading,
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			TaskItem.configure({
				nested: true,
			}),
			TaskList,
			BetterColor,
			BetterHighlight.configure({
				multicolor: true,
			}),
			ListKeymap,
			Indent,
			FontSize,
			Table.configure({
				resizable: true,
			}),
			TableRow,
			TableHeader,
			TableCell,
			HardBreak,
			BlobImages.configure({
				inline: true,
				allowBase64: true,
			}),
			SVGExtension.configure({
				inline: true,
			}),
			SelCharCount.extend().configure({
				wordCounter: (text) =>
					text.split(/[^\w~'\u2019-]+|[^\w]{2,}/g).filter((word) => word !== "")
						.length,
			}),
			MathExtension,
			Spacing.configure({
				types: ["heading", "paragraph"],
			}),
			RubyRoot,
			RubyAnnotation,
			RubyA11y,
			DesmosGraphExtension,
			DebugFallbackRenderer,
		],
		content: data.file.content,
		immediatelyRender: false,
		// editable: !data.locked, // may cause option desync when changed???
	});
	data.editor = editor ?? undefined;
	useEffect(() => {
		if (skipRender) return;
		const SELECTOR = [
			"input:not([type])",
			'input[type="text"]',
			'input[type="search"]',
			'input[type="number"]',
			"textarea",
			"[contenteditable]",
			"select",
			`.${HANDLES_CHARS}`,
		].join(", ");
		const SPECIAL_WHITELIST = {
			ArrowLeft: true,
			ArrowRight: true,
			ArrowUp: true,
			ArrowDown: true,
			Backspace: true,
			Delete: true,
			Enter: true,
			EraseEof: true,
			Paste: true,
			Undo: true,
			Redo: true,
			Dead: true,
		};
		const callback = (e: KeyboardEvent) => {
			if (
				e.key.length !== 1 /* No special keys */ &&
				!(e.key in SPECIAL_WHITELIST)
			)
				return;
			let extra = "";
			if (e.key === "Enter" || e.key === " ")
				extra = ", button, input, [tabindex]";
			if (!document.activeElement?.closest(SELECTOR + extra)) {
				// not in editor, focus
				editor?.$doc.element.focus();
				// not fast enough (uses requestAnimationFrame due to react bug, hope we dont run into same bug :E)
				editor?.commands.focus();
			}
		};
		document.addEventListener("keydown", callback);
		return () => document.removeEventListener("keydown", callback);
	}, [editor, skipRender]);

	useEffect(() => {
		editor?.setEditable(!data.locked);
	}, [editor, data.locked]);
	useEffect(() => {
		if (editor && data.initialSelection)
			editor.state.apply(
				editor.state.tr.setSelection(
					Selection.fromJSON(editor.state.doc, data.initialSelection),
				),
			);
	}, [editor, data.initialSelection]);

	React.useEffect(() => {
		editor?.on("selectionUpdate", () => {
			data.dirtyState();
		});
		editor?.on("update", () => {
			data.dirtyFile();
		});
	}, [editor, data]);

	if (skipRender) return <></>;
	return (
		<EditorContext.Provider value={data}>
			<ScrollProvider
				className={className}
				ref={(el) => {
					if (el && data.scrollPos) el.scrollTop = data.scrollPos;
					// setScrollingElement(el);
				}}
				onScroll={(e) => {
					data.scrollPos = e.currentTarget.scrollTop;
					data.dirtyState();
				}}
			>
				{data.locked ? undefined : <EditorToolbar className={toolbarClass} />}
				<EditorContent
					editor={editor}
					className={`tiptap ${editorClass}`}
					onKeyDownCapture={(e) => {
						data.lastKeyPress = e.key;
					}}
				/>
				{wordCount ? (
					<EditorStatsWidget className={statsWidgetClass} />
				) : undefined}
			</ScrollProvider>
		</EditorContext.Provider>
	);
}
