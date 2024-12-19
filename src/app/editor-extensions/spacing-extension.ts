import { Extension } from "@tiptap/core";

export interface SpacingOptions {
	/**
	 * The types where the text spacing attribute can be applied.
	 * @default []
	 * @example ['heading', 'paragraph']
	 */
	types: string[];

	/**
	 * The default text spacing.
	 * @default "1.15em"
	 * @example "1.5em"
	 */
	defaultSpacing: string;

	/**
	 * The default margins spacing.
	 * @default {}
	 * @example { marginTop: ".5em", marginBottom: ".5em" }
	 */
	defaultMargins: MarginProps;

	/**
	 * The default padding spacing.
	 * @default {}
	 * @example { paddingTop: ".5em", paddingBottom: ".5em" }
	 */
	defaultPadding: PaddingProps;
}

type MarginProps = {
	marginTop?: string;
	marginRight?: string;
	marginBottom?: string;
	marginLeft?: string;
};

type PaddingProps = {
	paddingTop?: string;
	paddingRight?: string;
	paddingBottom?: string;
	paddingLeft?: string;
};

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		Spacing: {
			/**
			 * Set the text spacing attribute
			 * @param spacing The spacing
			 * @example editor.commands.setLineHeight('1.5em')
			 */
			setLineHeight: (spacing: string) => ReturnType;
			/**
			 * Unset the text spacing attribute
			 * @example editor.commands.unsetLineHeight()
			 */
			unsetLineHeight: () => ReturnType;
			/**
			 * Set the margin spacing attribute
			 * @param margin The margins
			 * @example editor.commands.setMargins({ marginTop: ".5em", marginBottom: ".5em" })
			 */
			setMargins: (margins: MarginProps) => ReturnType;
			/**
			 * Unset the margin spacing attribute
			 * @example editor.commands.unsetMargins()
			 */
			unsetMargins: () => ReturnType;
			/**
			 * Set the padding spacing attribute
			 * @param padding The padding
			 * @example editor.commands.setPadding({ paddingTop: ".5em", paddingBottom: ".5em" })
			 */
			setPadding: (padding: PaddingProps) => ReturnType;
			/**
			 * Unset the padding spacing attribute
			 * @example editor.commands.unsetPadding()
			 */
			unsetPadding: () => ReturnType;
		};
	}
}

/**
 * This extension allows you to add spacing between text.
 */
export const Spacing = Extension.create<SpacingOptions>({
	name: "Spacing",

	addOptions() {
		return {
			types: [],
			defaultSpacing: "1.15em",
			defaultMargins: {},
			defaultPadding: {},
		};
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					lineHeight: {
						default: this.options.defaultSpacing,
						parseHTML: (element) => {
							return element.style.lineHeight || this.options.defaultSpacing;
						},
						renderHTML: (attributes) => {
							if (attributes.lineHeight === this.options.defaultSpacing) {
								return {};
							}

							return { style: `line-height: ${attributes.lineHeight}` };
						},
					},
					margin: {
						default: this.options.defaultMargins,
						parseHTML: (element) => {
							return element.style.margin || this.options.defaultMargins;
						},
						renderHTML: (attributes) => {
							if (attributes.margin === this.options.defaultMargins) {
								return {};
							}

							const margins = Object.entries(attributes.margin)
								.map(
									([key, value]) =>
										`margin-${key.slice(6).toLowerCase()}: ${value};`,
								)
								.join(" ");

							return {
								style: margins,
							};
						},
					},
					padding: {
						default: this.options.defaultPadding,
						parseHTML: (element) => {
							return element.style.padding || this.options.defaultPadding;
						},
						renderHTML: (attributes) => {
							if (attributes.padding === this.options.defaultPadding) {
								return {};
							}

							const paddings = Object.entries(attributes.padding)
								.map(
									([key, value]) =>
										`padding-${key.slice(7).toLowerCase()}: ${value};`,
								)
								.join(" ");

							return {
								style: paddings,
							};
						},
					},
				},
			},
		];
	},

	addCommands() {
		return {
			setLineHeight:
				(spacing: string) =>
				({ commands }) => {
					return this.options.types
						.map((type) =>
							commands.updateAttributes(type, { lineHeight: spacing }),
						)
						.every((response) => response);
				},
			unsetLineHeight:
				() =>
				({ commands }) => {
					return this.options.types
						.map((type) => commands.resetAttributes(type, "lineHeight"))
						.every((response) => response);
				},
			setMargins:
				(margins: MarginProps) =>
				({ commands }) => {
					return this.options.types
						.map((type) => commands.updateAttributes(type, { margin: margins }))
						.every((response) => response);
				},
			unsetMargins:
				() =>
				({ commands }) => {
					return this.options.types
						.map((type) => commands.resetAttributes(type, "margin"))
						.every((response) => response);
				},
			setPadding:
				(padding: PaddingProps) =>
				({ commands }) => {
					return this.options.types
						.map((type) =>
							commands.updateAttributes(type, { padding: padding }),
						)
						.every((response) => response);
				},
			unsetPadding:
				() =>
				({ commands }) => {
					return this.options.types
						.map((type) => commands.resetAttributes(type, "padding"))
						.every((response) => response);
				},
		};
	},
});
