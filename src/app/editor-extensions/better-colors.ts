import Color from "@tiptap/extension-color";

export const BetterColor = Color.extend({
	addGlobalAttributes() {
		const val = this.parent?.();
		return (val ?? []).map(attrSet => ({
			...attrSet,
			attributes: {
				...attrSet.attributes,
				color: {
					...(attrSet.attributes && "color" in attrSet.attributes
						? attrSet.attributes.color
						: {}),
					renderHTML: (attributes: { color?: string; }) => {
						const attrs =
							attrSet.attributes && "color" in attrSet.attributes
								? (attrSet.attributes.color?.renderHTML?.(attributes) ?? {})
								: {};
						if (attributes.color) {
							attrs.style ??= "";
							attrs.style += `;--tiptap-foreground-color: ${attributes.color};`;
						}
						return attrs;
					},
				},
			},
		}));
	},
});
