import { mergeAttributes, Node } from "@tiptap/core";

export interface PageOptions {
	/**
	 * Custom HTML attributes that should be added to the rendered HTML tag.
	 * @default {}
	 * @example { class: 'foo' }
	 */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		// page: {};
	}
}

export const Page = Node.create<PageOptions>({
	name: "codeBlock",

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	content: "block+",
	marks: "_",
	group: "block",
	defining: true,

	parseHTML() {
		return [
			{
				tag: "section",
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"section",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
			0,
		];
	},
});
