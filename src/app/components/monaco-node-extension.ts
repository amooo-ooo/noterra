import CodeBlock from "@tiptap/extension-code-block";
import { mergeAttributes, ReactNodeViewRenderer } from "@tiptap/react";
import { MonacoEditor } from "./monaco-editor";
import type { EditorProps } from "@monaco-editor/react";
import type { Node } from "@tiptap/pm/model";

declare module "@tiptap/extension-code-block" {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export interface CodeBlockOptions extends EditorProps {}
}

// TODO: tiptap doesnt support multi-line matching
// const pasteRule =
// 	// biome-ignore lint/correctness/noEmptyCharacterClassInRegex: <explanation>
// 	/(?:^|\s)(```|~~~)(?:(\w+)$[\r\n]+|[\r\n]*)([^]*?)\1(?:$|\s)/gm;

export const MonacoCodeBlockExtention = CodeBlock.extend({
	addNodeView() {
		return ReactNodeViewRenderer(MonacoEditor, {});
	},

	onBeforeCreate() {
		const original = this.type.create.bind(this.type);
		this.type.create = (attrs, content, ...args) => {
			console.log(content);
			return original(
				{ content: (content as Node | null)?.text, ...attrs },
				null,
				...args,
			);
		};
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
				},
				node.attrs.content,
			],
		];
	},

	renderText({ node }) {
		return `${"```"}${node.attrs.language ?? ""}\n${node.attrs.content}\n${"```"}`;
	},

	addAttributes() {
		return {
			...this.parent?.(),
			content: {
				default: "",
				parseHTML: (element) => {
					return element.firstElementChild?.textContent ?? null;
				},
				rendered: false,
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

	content: undefined,
});
