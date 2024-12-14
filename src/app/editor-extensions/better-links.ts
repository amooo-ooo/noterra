import { mergeAttributes } from "@tiptap/core";
import Link from "@tiptap/extension-link";

export const BetterLinks = Link.extend({
	renderHTML({ mark, HTMLAttributes }) {
		return (
			this.parent?.({
				mark,
				HTMLAttributes: { title: mark.attrs.href, ...HTMLAttributes },
			}) ?? [
				"a",
				mergeAttributes(
					this.options.HTMLAttributes,
					{ title: mark.attrs.href },
					HTMLAttributes,
				),
				0,
			]
		);
	},
});
