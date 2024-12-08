import {
	type Editor as TipTapEditor,
	EditorContent,
	useEditor,
} from "@tiptap/react";
import React, { useEffect } from "react";
import { EditorToolbar } from "./editor-toolbar";

import Text from "@tiptap/extension-text";
import Document from "@tiptap/extension-document";
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
import Link from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import Heading from '@tiptap/extension-heading'

import { MonacoCodeBlockExtention } from "./monaco-node-extension";
import styles from "@/app/styles/tiptap.module.css";

export interface EditorData {
	id: string;
	name: string;
	initialContent: string;
	editor?: TipTapEditor;
	lastKeyPress?: KeyboardEvent["key"];
	scrollingElement?: HTMLElement;
}

export const EditorContext = React.createContext(null as unknown as EditorData);

export const HANDLES_CHARS = 'consume-input-events';

export function Editor({
	data,
	skipRender = false,
	className,
	toolbarClass,
	editorClass = "",
}: {
	data: EditorData;
	skipRender?: boolean;
	className?: string;
	toolbarClass?: string;
	editorClass?: string;
}) {
	const editor = useEditor({
		extensions: [
			Document,
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
			Link,
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
		],
		content: data.initialContent,
		immediatelyRender: false,
	});
	data.editor = editor ?? undefined;
	useEffect(() => {
		if (skipRender) return;
		const SELECTOR = [
			"input:not([type])",
			'input[type="text"]',
			'input[type="search"]',
			"textarea",
			"[contenteditable]",
			"select",
			`.${HANDLES_CHARS}`
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
	if (skipRender) return <></>;
	return (
		<EditorContext.Provider value={data}>
			<div className={className} ref={(el) => {
				data.scrollingElement = el ?? undefined;
			}}>
				<EditorToolbar className={toolbarClass} />
				<EditorContent
					editor={editor}
					className={`${styles.tiptap} ${editorClass}`}
					onKeyDownCapture={(e) => {
						data.lastKeyPress = e.key;
					}}
				/>
			</div>
		</EditorContext.Provider>
	);
}
