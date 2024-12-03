import {
	type Editor as TipTapEditor,
	EditorContent,
	useEditor,
} from "@tiptap/react";
import React from "react";
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

import { MonacoCodeBlockExtention } from "./monaco-node-extension";
import style from "../styles/tiptap.module.css";

export interface EditorData {
	id: string;
	name: string;
	editor?: TipTapEditor;
	lastKeyPress?: KeyboardEvent["key"];
}

export const EditorContext = React.createContext(null as unknown as EditorData);

export function Editor({
	data,
	skipRender = false,
	toolbarClass,
	editorClass = "",
}: {
	data: EditorData;
	skipRender?: boolean;
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
		],
		content: "hello",
		immediatelyRender: false,
	});
	data.editor = editor ?? undefined;
	if (skipRender) return <></>;
	return (
		<EditorContext.Provider value={data}>
			<EditorToolbar className={toolbarClass} />
			<EditorContent
				editor={editor}
				className={`${style.tiptap} ${editorClass}`}
				onKeyDownCapture={(e) => {
					data.lastKeyPress = e.key;
				}}
			/>
		</EditorContext.Provider>
	);
}
