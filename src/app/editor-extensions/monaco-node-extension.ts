import CodeBlock from "@tiptap/extension-code-block";
import {
	mergeAttributes,
	ReactNodeViewRenderer,
	type SingleCommands,
} from "@tiptap/react";
import { MonacoEditor } from "../components/monaco-editor";
import type { EditorProps } from "@monaco-editor/react";

declare module "@tiptap/extension-code-block" {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export interface CodeBlockOptions extends EditorProps {}
}

// TODO: tiptap doesnt support multi-line matching
// const pasteRule =
// 	// biome-ignore lint/correctness/noEmptyCharacterClassInRegex: <explanation>
// 	/(?:^|\s)(```|~~~)(?:(\w+)$[\r\n]+|[\r\n]*)([^]*?)\1(?:$|\s)/gm;

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		monacoCodeBlock: Commands<ReturnType>["codeBlock"] & {
			/**
			 * Unset a code block
			 * @example editor.commands.unsetCodeBlock()
			 */
			unsetCodeBlock: () => ReturnType;
		};
	}
}

export const MonacoCodeBlockExtention = CodeBlock.extend({
	name: "monacoCodeBlock",

	addNodeView() {
		return ReactNodeViewRenderer(MonacoEditor, {});
	},

	renderHTML({ node, HTMLAttributes }) {
		return [
			"pre",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
			[
				"code",
				{
					class: node.attrs.language
						? this.options.languageClassPrefix + node.attrs.language
						: null,
					...(node.attrs.hasUsed ? {} : { "data-should-focus": true }),
				},
				0,
			],
		];
	},

	renderText({ node }) {
		return `${"```"}${node.attrs.language ?? ""}\n${node.content}\n${"```"}`;
	},

	addCommands() {
		return {
			...this.parent?.(),
			// TODO: preserve newlines
			unsetCodeBlock:
				() =>
				({ commands }: { commands: SingleCommands }) => {
					return commands.setNode("paragraph");
				},
		};
	},

	addAttributes() {
		return {
			...this.parent?.(),
			hasUsed: {
				default: false,
				parseHTML: (el) => !el.dataset.shouldFocus,
			},
		};
	},

	// addPasteRules() {
	// 	return [
	// 		nodePasteRule({
	// 			find: pasteRule,
	// 			type: this.type,
	// 			getAttributes: (match: string[]) => ({
	// 				language: match[2],
	// 				content: match[3],
	// 			}),
	// 		}),
	// 	];
	// },
});
