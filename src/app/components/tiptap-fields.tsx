import type { ChainedCommands, Editor } from "@tiptap/react";
import { EditorContext } from "./editor";
import React from "react";
import { Select, type SelectProps } from "./select";

export function TiptapButton({
	label,
	action,
	detect,
	disabled,
	icon,
	...props
}: {
	label: string;
	action?: (ctx: ChainedCommands) => ChainedCommands;
	detect?: string | ((editor: Editor) => boolean);
	disabled?: boolean | ((editor: Editor) => boolean);
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
			disabled={
				!editor ||
				(typeof disabled === "function" ? disabled(editor) : disabled) ||
				!action
			}
			className={`toolbar-button ${isActive ? "is-active" : ""} ${props.className ?? ""}`}
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
	...props
}: {
	label: string;
	action?: (value: string, ctx: ChainedCommands) => ChainedCommands;
	detect: (editor: Editor) => string;
} & SelectProps) {
	const editor = React.useContext(EditorContext).editor;

	return (
		<Select
			title={label}
			value={editor ? detect(editor) : ""}
			onChange={(value) => {
				onChange?.(value);
				if (editor) action?.(value, editor.chain().focus()).run();
			}}
			{...props}
		/>
	);
}
