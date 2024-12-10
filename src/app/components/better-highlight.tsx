import Highlight from "@tiptap/extension-highlight";

export const BetterHighlight = Highlight.extend({
	addAttributes() {
		const val = this.parent?.();
		console.log("as");
		return {
			...val,
			color: {
				...(val && "color" in val ? val.color : {}),
				renderHTML: (attributes: { color?: string }) => {
					const attrs =
						val && "color" in val
							? (val.color.renderHTML?.(attributes) ?? {})
							: {};
					if (attributes.color) {
						attrs.style ??= "";
						attrs.style += `;--tiptap-highlight-color: ${attributes.color};`;
					}
					return attrs;
				},
			},
		};
	},
});
