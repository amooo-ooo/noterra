"use client";

import "material-symbols";
import type React from "react";

export type IconProps = {
	size?: React.CSSProperties["fontSize"];
	iconStyle?: "outlined" | "rounded" | "sharp";
	style?: React.CSSProperties
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
			...style
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
export const Link = createIcon("Link", "\ue157");