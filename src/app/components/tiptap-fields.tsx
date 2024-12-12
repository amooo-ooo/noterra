import type { ChainedCommands, Editor } from "@tiptap/react";
import { EditorContext } from "./editor";
import React from "react";
import { Option, Select, type SelectProps } from "./select";
import styles from "@/app/styles/editor-toolbar.module.scss";
import { anyPass } from "./util";

export function TiptapButton({
	label,
	action,
	detect,
	icon,
	...props
}: {
	label: string;
	action?: (ctx: ChainedCommands) => ChainedCommands;
	detect?: string | ((editor: Editor) => boolean);
	icon?: React.ReactNode;
} & Omit<React.HTMLProps<HTMLButtonElement>, "action" | "disabled">) {
	const editor = React.useContext(EditorContext).editor;
	const isActive =
		typeof detect === "function"
			? editor && detect(editor)
			: detect
				? editor?.isActive(detect)
				: false;

	return (
		<button
			title={label}
			{...props}
			type="button"
			onClick={
				action
					? (e) => {
							if (editor) action(editor.chain().focus()).run();
							props.onClick?.(e);
						}
					: props.onClick
			}
			disabled={!editor || !action?.(editor.can().chain().focus()).run()}
			className={`${styles["toolbar-button"]} ${isActive ? styles.active : ""} ${props.className ?? ""}`}
		>
			{props.children ?? icon ?? label}
		</button>
	);
}

export function TiptapSelect({
	label,
	action,
	detect,
	onChange,
	disabled,
	children,
	...props
}: {
	label: string;
	action?:
		| ((value: string, ctx: ChainedCommands) => ChainedCommands)
		| {
				perform(value: string, ctx: ChainedCommands): Promise<ChainedCommands>;
				detect(value: string, ctx: ChainedCommands): ChainedCommands;
		  };
	detect: (editor: Editor) => string;
} & SelectProps) {
	const editor = React.useContext(EditorContext).editor;
	const [openState, setOpenState] = React.useState(false);

	const actionDetect = typeof action === "function" ? action : action?.detect;
	const actionPerform = typeof action === "function" ? action : action?.perform;

	// Cannot useMemo, we need to update whenever editor selection changes
	const [options, hasUsable] = (() => {
		if (!openState)
			return [
				children,
				!editor ||
					!actionDetect ||
					(Array.isArray(children) ? !children.length : !children) ||
					anyPass(
						React.Children.map(children, (el) => el?.props.value) ?? [""],
						(value) => actionDetect(value, editor.can().chain().focus()).run(),
					),
			];
		let hasUsable = false;
		return [
			React.Children.map(children, (opt) => {
				if (!opt) return;
				const usable =
					!editor ||
					!actionDetect ||
					actionDetect(opt.props.value, editor.can().chain().focus()).run();
				if (usable) hasUsable = true;
				if (opt.props.disabled || usable) return opt; // no change
				return React.cloneElement(opt, {
					disabled: opt.props.disabled || !usable,
				});
			}),
			hasUsable,
		];
	})();

	return (
		<Select
			title={label}
			value={editor ? detect(editor) : ""}
			{...props}
			disabled={disabled || !hasUsable}
			onChange={async (value) => {
				onChange?.(value);
				if (editor)
					(await actionPerform?.(value, editor.chain().focus()))?.run();
			}}
			onToggleOpen={(open) => {
				setOpenState(open);
				props.onToggleOpen?.(open);
			}}
			className={`${styles["toolbar-select"]} ${props.className ?? ""}`}
		>
			{options}
		</Select>
	);
}

interface FontData {
	family: string;
	fullName: string;
	postscriptName: string;
	style: string;
	blob(): Promise<Blob>;
}

declare global {
	interface Window {
		queryLocalFonts(): Promise<FontData[]>;
	}
}

type FontMap = {
	[key: string]: { loaded: boolean; faces: FontData[] };
};

async function loadFont(faces: FontData[]) {
	await Promise.allSettled(
		faces.map(async (face) => {
			const data = await (await face.blob()).arrayBuffer();
			const props: FontFaceDescriptors = {};
			for (const token of face.style)
				switch (token.toLowerCase()) {
					case "thin":
					case "hairline":
						props.weight = props.weight ? `${props.weight} 100` : "100";
						break;
					case "extralight":
					case "ultralight":
						props.weight = props.weight ? `${props.weight} 200` : "200";
						break;
					case "light":
						props.weight = props.weight ? `${props.weight} 300` : "300";
						break;
					case "semilight":
					case "normal":
					case "regular":
						props.weight = props.weight ? `${props.weight} 400` : "400";
						break;
					case "medium":
						props.weight = props.weight ? `${props.weight} 500` : "500";
						break;
					case "semibold":
					case "demibold":
						props.weight = props.weight ? `${props.weight} 600` : "600";
						break;
					case "bold":
						props.weight = props.weight ? `${props.weight} 700` : "700";
						break;
					case "extrabold":
					case "ultrabold":
						props.weight = props.weight ? `${props.weight} 800` : "800";
						break;
					case "black":
					case "heavy":
						props.weight = props.weight ? `${props.weight} 900` : "900";
						break;
					case "italic":
						props.style = "italic";
						break;
					case "oblique":
						props.style = "oblique";
						break;
					case "ultracondensed":
						props.stretch = "50%";
						break;
					case "extracondensed":
						props.stretch = "62.5%";
						break;
					case "condensed":
					case "compressed":
						props.stretch = "75%";
						break;
					case "narrow":
					case "semicondensed":
						props.stretch = "87.5%";
						break;
					case "semiexpanded":
						props.stretch = "112.5%";
						break;
					case "expanded":
						props.stretch = "125%";
						break;
					case "extraexpanded":
						props.stretch = "150%";
						break;
					case "ultraexpanded":
						props.stretch = "200%";
						break;
					// Poster
					// Retina
					// Roman
					// Banner
					// Display
					// Heading
					// Small
					// Subheading
					// Text
				}
			const font = new FontFace(face.family, data, props);
			document.fonts.add(font);
			await font.load();
		}),
	);
}

export function FontFamilySelect() {
	const [localFonts, setLocalFonts] = React.useState<FontMap>();
	return (
		<TiptapSelect
			label="Font"
			detect={(ed) => ed.getAttributes("textStyle").fontFamily ?? "Inter"}
			action={{
				async perform(value, ctx) {
					if (localFonts?.[value] && !localFonts[value].loaded) {
						await loadFont(localFonts[value].faces);
						localFonts[value].loaded = true;
					}
					return ctx.setFontFamily(value);
				},
				detect(value, ctx) {
					return ctx.setFontFamily(value);
				},
			}}
			onToggleOpen={async () => {
				if (!localFonts && "queryLocalFonts" in window) {
					const fonts = await window.queryLocalFonts();
					const fontMap: FontMap = {};
					for (const font of fonts) {
						if (font.family === "Inter") continue;
						// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
						(fontMap[font.family] ??= { loaded: false, faces: [] }).faces.push(
							font,
						);
					}
					setLocalFonts(fontMap);
				}
			}}
		>
			{[
				<Option
					label="Inter"
					value="var(--font-inter-sans)"
					key="Inter"
					style={{ fontFamily: "var(--font-inter-sans), inherit" }}
				/>,
				// ...[
				// 	["Inter", "var(--font-inter-sans), sans-serif"],
				// 	["Comic Sans", "'Comic Sans MS', cursive, sans-serif"],
				// 	["Arial", "Arial, Helvetica, sans-serif"],
				// 	["Georgia", "Georgia, serif"],
				// 	["Times New Roman", "'Times New Roman', Times, serif"],
				// 	["Courier New", "'Courier New', Courier, monospace"],
				// 	["Verdana", "Verdana, Geneva, sans-serif"],
				// 	["Tahoma", "Tahoma, Geneva, sans-serif"],
				// 	["Trebuchet MS", "'Trebuchet MS', Helvetica, sans-serif"],
				// 	["Lucida Sans", "'Lucida Sans', 'Lucida Grande', sans-serif"],
				// ].map(([font, src]) => (
				// 	<Option
				// 		label={font}
				// 		value={src}
				// 		key={font}
				// 		style={{ fontFamily: src }}
				// 	/>
				// )),
				...Object.entries(localFonts ?? {}).map(([name]) => (
					<Option
						label={name}
						value={JSON.stringify(name)}
						key={name}
						style={{ fontFamily: `${JSON.stringify(name)}, inherit` }}
					/>
				)),
			]}
		</TiptapSelect>
	);
}
