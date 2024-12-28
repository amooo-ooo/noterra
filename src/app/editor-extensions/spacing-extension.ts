import { Extension } from "@tiptap/core";
import {
	type Size,
	type SidedSizeProps,
	parseSidedSizes,
} from "@/app/css-util";

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
	defaultLineHeight: Size;

	/**
	 * The default margins spacing.
	 * @default {}
	 * @example { marginTop: ".5em", marginBottom: ".5em" }
	 */
	defaultMargins: SidedSizeProps;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		spacing: {
			/**
			 * Set the text spacing attribute
			 * @param spacing The spacing
			 * @example editor.commands.setLineHeight('1.5em')
			 */
			setLineHeight: (spacing: Size) => ReturnType;
			/**
			 * Unset the text spacing attribute
			 * @example editor.commands.unsetLineHeight()
			 */
			unsetLineHeight: () => ReturnType;
			/**
			 * Set the margin spacing attribute
			 * @param margin The margins
			 * @example editor.commands.setMargins({ top: ".5em", bottom: ".5em" })
			 */
			setMargins: (margins: SidedSizeProps) => ReturnType;
			/**
			 * Unset the margin spacing attribute
			 * @example editor.commands.unsetMargins()
			 */
			unsetMargins: () => ReturnType;
			// /**
			//  * Set the padding spacing attribute
			//  * @param padding The padding
			//  * @example editor.commands.setPadding({ paddingTop: ".5em", paddingBottom: ".5em" })
			//  */
			// setPadding: (padding: PaddingProps) => ReturnType;
			// /**
			//  * Unset the padding spacing attribute
			//  * @example editor.commands.unsetPadding()
			//  */
			// unsetPadding: () => ReturnType;
		};
	}
}

/**
 * This extension allows you to add spacing between text.
 */
export const Spacing = Extension.create<SpacingOptions>({
	name: "spacing",

	addOptions() {
		return {
			types: [],
			defaultLineHeight: "1.15em",
			defaultMargins: 0,
		} satisfies SpacingOptions;
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					lineHeight: {
						default: this.options.defaultLineHeight,
						parseHTML: (element) => {
							return element.style.lineHeight || this.options.defaultLineHeight;
						},
						renderHTML: (attributes) => {
							if (attributes.lineHeight === this.options.defaultLineHeight) {
								return {};
							}

							return {
								style: `line-height: ${attributes.lineHeight};`,
							};
						},
					},
					margin: {
						default: this.options.defaultMargins,
						parseHTML: (element) => {
							const margins = parseSidedSizes(this.options.defaultMargins);
							return (
								element.style.margin ||
								Object.fromEntries(
									(["top", "left", "bottom", "right"] as const).map((side) => [
										side,
										element.style.getPropertyValue(`margin-${side}`) ||
											margins[side],
									]),
								)
							);
						},
						renderHTML: (attributes: { margin?: SidedSizeProps }) => {
							if (
								attributes.margin === this.options.defaultMargins ||
								attributes.margin === undefined
							) {
								return {};
							}

							const margins =
								typeof attributes.margin === "object"
									? Object.entries(attributes.margin).reduce(
											(str, [key, value]) =>
												`${str}margin-${key}: ${`${value}`.replace(/(?<=[\d.])$/, "px")};`,
											"",
										)
									: `margin: ${attributes.margin};`.replace(
											/([\d.])(\s|;)/,
											"$1px$2",
										);

							return {
								style: margins,
							};
						},
					},
					// padding: {
					// 	default: this.options.defaultPadding,
					// 	parseHTML: (element) => {
					// 		return element.style.padding || this.options.defaultPadding;
					// 	},
					// 	renderHTML: (attributes) => {
					// 		if (attributes.padding === this.options.defaultPadding) {
					// 			return {};
					// 		}

					// 		const paddings = Object.entries(attributes.padding)
					// 			.map(
					// 				([key, value]) =>
					// 					`padding-${key.slice(7).toLowerCase()}: ${value};`,
					// 			)
					// 			.join(" ");

					// 		return {
					// 			style: paddings,
					// 		};
					// 	},
					// },
				},
			},
		];
	},

	addCommands() {
		return {
			setLineHeight:
				(spacing: Size) =>
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
				(margins: SidedSizeProps) =>
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
			// setPadding:
			// 	(padding: PaddingProps) =>
			// 	({ commands }) => {
			// 		return this.options.types
			// 			.map((type) =>
			// 				commands.updateAttributes(type, { padding: padding }),
			// 			)
			// 			.every((response) => response);
			// 	},
			// unsetPadding:
			// 	() =>
			// 	({ commands }) => {
			// 		return this.options.types
			// 			.map((type) => commands.resetAttributes(type, "padding"))
			// 			.every((response) => response);
			// 	},
		};
	},
});
