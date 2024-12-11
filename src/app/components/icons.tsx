"use client";

import "material-symbols";
import type React from "react";

export type IconProps = {
	size?: React.CSSProperties["fontSize"];
	iconStyle?: "outlined" | "rounded" | "sharp";
	style?: React.CSSProperties;
};

type GeneralIconProps = IconProps & {
	codePoint?: string;
	label: string;
};

export const Icon = ({
	codePoint,
	label,
	style,
	iconStyle = "rounded",
	size = "1.8em",
}: GeneralIconProps) => (
	<span
		className={`material-symbols-${iconStyle}`}
		role="img"
		aria-label={label.replace(/([a-z])([A-Z])/g, "$1 $2")}
		style={{
			display: "block",
			fontSize: size,
			...style,
		}}
	>
		{codePoint ?? label}
	</span>
);

const createIcon = (name: string, codePoint: string) => {
	const component = (props: IconProps) => (
		<Icon codePoint={codePoint} label={name} {...props} />
	);
	component.displayName = `${name}Icon`;
	return component;
};

export const FormatBold = createIcon("FormatBold", "\ue238");
export const FormatItalic = createIcon("FormatItalic", "\ue23f");
export const FormatUnderline = createIcon("FormatUnderline", "\ue249");
export const FormatStrikethrough = createIcon("FormatStrikethrough", "\ue246");
export const FormatQuote = createIcon("FormatQuote", "\ue244");
// export const FormatIndentIncrease = createIcon("FormatIndentIncrease", "\ue23e");
// export const FormatIndentDecrease = createIcon("FormatIndentDecrease", "\ue23d");

// export const Link = createIcon("Link", "\ue157");
// export const Remove = createIcon("Remove", "\ue15b");
// export const Close = createIcon("Close", "\ue5cd");
// export const Add = createIcon("Add", "\ue145");
// export const AddCircle = createIcon("AddCircle", "\ue147");
// export const Superscript = createIcon("Superscript", "\uf112");
// export const Subscript = createIcon("Subscript", "\uf111");
// export const FormatListBulleted = createIcon("FormatListBulleted", "\ue241");
// export const FormatListNumbered = createIcon("FormatListNumbered", "\ue242");
// export const Checklist = createIcon("checklist", "\ue6b1");
// export const Code = createIcon("Code", "\ue86f");
// export const CodeBlocks = createIcon("CodeBlocks", "\uf84d");
// export const Undo = createIcon("Undo", "\ue166");
// export const Redo = createIcon("Redo", "\ue15a");
// export const HorizontalRule = createIcon("HorizontalRule", "\uf108");
// export const Upload = createIcon("Upload", "\uf09b");
// export const LightMode = createIcon("LightMode", "\ue518");
// export const DarkMode = createIcon("DarkMode", "\ue51c");
// export const FormatAlignLeft = createIcon("FormatAlignLeft", "\ue236");
// export const FormatAlignCenter = createIcon("FormatAlignCenter", "\ue234");
// export const FormatAlignRight = createIcon("FormatAlignRight", "\ue237");
// export const FormatAlignJustify = createIcon("FormatAlignJustify", "\ue235");
