import { Mark, mergeAttributes } from "@tiptap/react";

export interface RubyOptions {
	/**
	 * HTML attributes to add to the highlight element.
	 * @default {}
	 * @example { class: 'foo' }
	 */
	HTMLAttributes: Record<string, unknown>;
}

// declare module "@tiptap/core" {
// 	interface Commands<ReturnType> {
// 		highlight: {
// 			/**
// 			 * Set a highlight mark
// 			 * @param attributes The highlight attributes
// 			 * @example editor.commands.setHighlight({ color: 'red' })
// 			 */
// 			setHighlight: (attributes?: { color: string }) => ReturnType;
// 			/**
// 			 * Toggle a highlight mark
// 			 * @param attributes The highlight attributes
// 			 * @example editor.commands.toggleHighlight({ color: 'red' })
// 			 */
// 			toggleHighlight: (attributes?: { color: string }) => ReturnType;
// 			/**
// 			 * Unset a highlight mark
// 			 * @example editor.commands.unsetHighlight()
// 			 */
// 			unsetHighlight: () => ReturnType;
// 		};
// 	}
// }

export const RubyRoot = Mark.create<RubyOptions>({
	name: "ruby",

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [
			{
				tag: "ruby",
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"ruby",
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
			0,
		];
	},
});

export const RubyAnnotation = Mark.create({
	name: "ruby-annotation",

	parseHTML() {
		return [
			{
				tag: "rt",
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["rt", HTMLAttributes, 0];
	},
});

export const RubyA11y = Mark.create({
	name: "ruby-a11y",

	parseHTML() {
		return [
			{
				tag: "rp",
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["rp", HTMLAttributes, 0];
	},
});
