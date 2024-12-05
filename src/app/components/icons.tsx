"use client";

import "material-symbols";
import type React from "react";

export type IconProps = {
	size?: React.CSSProperties["fontSize"];
};

type GeneralIconProps = IconProps & {
	codePoint?: string;
	label: string;
	iconStyle?: "outlined" | "rounded" | "sharp";
};

export const Icon = ({
	codePoint,
	label,
	iconStyle = "outlined",
	size = "1.8em",
}: GeneralIconProps) => (
	<span
		className={`material-symbols-${iconStyle}`}
		role="img"
		aria-label={label.replace(/([a-z])([A-Z])/g, "$1 $2")}
		style={{
			display: "block",
			fontSize: size,
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

export const Close = createIcon("Close", "\ue5cd");
export const Add = createIcon("Add", "\ue145");
export const Remove = createIcon("Remove", "\ue15b");
export const FormatBold = createIcon("FormatBold", "\ue238");
export const FormatItalic = createIcon("FormatItalic", "\ue23f");
export const FormatUnderline = createIcon("FormatUnderline", "\ue249");
export const FormatStrikethrough = createIcon("FormatStrikethrough", "\ue246");
export const Superscript = createIcon("Superscript", "\uf112");
export const Subscript = createIcon("Subscript", "\uf111");
export const FormatListBulleted = createIcon("FormatListBulleted", "\ue241");
export const FormatListNumbered = createIcon("FormatListNumbered", "\ue242");
export const Code = createIcon("Code", "\ue86f");
export const CodeBlocks = createIcon("CodeBlocks", "\uf84d");
export const FormatQuote = createIcon("FormatQuote", "\ue244");
export const Undo = createIcon("Undo", "\ue166");
export const Redo = createIcon("Redo", "\ue15a");
export const Link = createIcon("Link", "\ue157");
export const HorizontalRule = createIcon("HorizontalRule", "\uf108");
