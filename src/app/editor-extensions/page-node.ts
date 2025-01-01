import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import { PageRenderer } from "./page-renderer";
import { pxIfy } from "@/app/css-util";

export interface PageOptions {
	/**
	 * Custom HTML attributes that should be added to the rendered HTML tag.
	 * @default {}
	 * @example { class: 'foo' }
	 */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation> 
	HTMLAttributes: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// declare module "@tiptap/core" {
// 	interface Commands<ReturnType> {
// 		page: {};
// 	}
// }

export const PagedDocument = Document.extend({
	content: "page+",
});
export const MaybePagedDocument = Document.extend({
	content: "block+|page+",
});

export const PageNode = Node.create<PageOptions>({
	name: "page",

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	content: "block+",
	group: "page",
	defining: true,

	addAttributes() {
		return {
			width: {
				default: 800,
				keepOnSplit: true,
				parseHTML(element) {
					return element.style.width || 800;
				},
				renderHTML(attributes) {
					return {
						style: `width: ${pxIfy(attributes.width)};`
					};
				},
			},
			height: {
				default: 'auto',
				keepOnSplit: true,
				parseHTML(element) {
					return element.style.width || 'auto';
				},
				renderHTML(attributes) {
					return {
						style: `height: ${pxIfy(attributes.height)};`
					};
				},
			}
		};
	},

	parseHTML() {
		return [{ tag: "section" }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"section",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
			0,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(PageRenderer, {});
	},
});
