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

import { Bold as BoldExtension } from "@tiptap/extension-bold";
import { Italic as ItalicExtension } from "@tiptap/extension-italic";
import { Strike as StrikeExtension } from "@tiptap/extension-strike";
import { Underline as UnderlineExtension } from "@tiptap/extension-underline";
import { Code as CodeExtension } from "@tiptap/extension-code";
import { BulletList as BulletListExtension } from "@tiptap/extension-bullet-list";
import { OrderedList as OrderedListExtension } from "@tiptap/extension-ordered-list";
import { Subscript as SubscriptExtension } from '@tiptap/extension-subscript';
import { Superscript as SuperscriptExtension } from '@tiptap/extension-superscript';
import { History as HistoryExtension } from '@tiptap/extension-history';
import { Blockquote as BlockquoteExtension} from '@tiptap/extension-blockquote'
import { HorizontalRule as HorizontalRuleExtension } from '@tiptap/extension-horizontal-rule'
import { Link as LinkExtension } from '@tiptap/extension-link'
import { Typography as TypographyExtension } from '@tiptap/extension-typography'

import { MonacoCodeBlockExtention } from "./monaco-node-extension";

export interface EditorData {
	id: string;
	name: string;
	editor?: TipTapEditor;
	lastKeyPress?: KeyboardEvent["key"];
}

export const EditorContext = React.createContext(null as unknown as EditorData);

export function Editor({
	data,
	skipRender,
}: { data: EditorData; skipRender: boolean }) {
	const editor = useEditor({
		extensions: [
			Document,
			Text,
			ListItem,
			Paragraph,
			BoldExtension,
			ItalicExtension,
			StrikeExtension,
			UnderlineExtension,
			SubscriptExtension,
			SuperscriptExtension,
			CodeExtension,
			BulletListExtension,
			OrderedListExtension,
			HistoryExtension,
			HorizontalRuleExtension,
			LinkExtension,
			TypographyExtension,
			BlockquoteExtension,
			MonacoCodeBlockExtention.configure({
				options: {
					scrollbar: {
						vertical: "hidden",
					},
					minimap: {
						enabled: false,
					},
					theme: 'vs-dark',
				}
			}),
		],
		content: 'hello',
		immediatelyRender: false,
	});
	data.editor = editor ?? undefined;
	if (skipRender) return <></>;
	return (
		<EditorContext.Provider value={data}>
			<EditorToolbar />
			<EditorContent editor={editor} onKeyDownCapture={e => {
				data.lastKeyPress = e.key;
			}} />
		</EditorContext.Provider>
	);
}
