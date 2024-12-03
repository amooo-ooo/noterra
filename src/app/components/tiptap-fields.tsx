import type { ChainedCommands, Editor } from "@tiptap/react";
import { EditorContext } from "./editor";
import React from "react";

export function TiptapButton({ label, action, detect, icon, ...props }: {
	label: string;
	action?: (ctx: ChainedCommands) => ChainedCommands;
	detect?: (editor: Editor) => boolean;
	icon?: React.ReactNode;
} & Omit<React.HTMLProps<HTMLButtonElement>, 'action'>) {
	const editor = React.useContext(EditorContext).editor;

	return (
		<button
			title={label}
			{...props}
			type="button"
			onClick={action ? e => {
				if(editor) action(editor.chain().focus()).run();
				props.onClick?.(e);
			} : props.onClick}
			disabled={!editor || props.disabled || !action}
			className={`toolbar-button ${editor && detect?.(editor) ? "is-active" : ""} ${props.className ?? ''}`}
		>
			{icon ?? label}
		</button>
	);
}
