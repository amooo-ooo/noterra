import type { ChainedCommands, Editor } from "@tiptap/react";
import { EditorContext } from "./editor";
import React from "react";
import { Select, type SelectProps } from "./select";
import styles from '@/app/styles/editor-toolbar.module.css';
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
			disabled={
				!editor ||
				!action?.(editor.can().chain().focus()).run()
			}
			className={`${styles['toolbar-button']} ${isActive ? styles.active : ""} ${props.className ?? ""}`}
		>
			{props.children ?? icon ?? label}
		</button>
	);
}

// /* noexport */ function TiptapOption({internalOption, action, editor, hasUsableRef}: {
// 	internalOption: React.ReactElement<OptionProps, typeof Option>;
// 	action?: (value: string, ctx: ChainedCommands) => ChainedCommands;
// 	editor: Editor | undefined;
// 	hasUsableRef?: React.MutableRefObject<boolean>;
// }) {
// 	const useable = React.useMemo(() => !editor || !action
// 		|| action(internalOption.props.value, editor.can().chain().focus()).run(),
// 		[internalOption.props.value, action, editor]);
// 	if (hasUsableRef && useable) hasUsableRef.current = true;
// 	return <>{}</>;
// }

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
	action?: (value: string, ctx: ChainedCommands) => ChainedCommands;
	detect: (editor: Editor) => string;
} & SelectProps) {
	const editor = React.useContext(EditorContext).editor;
	const [openState, setOpenState] = React.useState(false);

	// Cannot useMemo, we need to update whenever editor selection changes
	const [options, hasUsable] = (() => {
		if (!openState) return [children, !editor || !action ||
			anyPass(React.Children.map(children, el => el?.props.value) ?? [''],
				value => action(value, editor.can().chain().focus()).run())]
		let hasUsable = false;
		return [React.Children.map(children, opt => {
			if (!opt) return;
			const usable = !editor || !action
				|| action(opt.props.value, editor.can().chain().focus()).run();
			if (usable) hasUsable = true;
			return React.cloneElement(opt, {
				disabled: opt.props.disabled || !usable
			});
		}), hasUsable];
	})();

	return (
		<Select
			title={label}
			value={editor ? detect(editor) : ""}
			{...props}
			disabled={disabled || !hasUsable}
			onChange={(value) => {
				onChange?.(value);
				if (editor) action?.(value, editor.chain().focus()).run();
			}}
			onToggleOpen={setOpenState}
			className={`${styles['toolbar-select']} ${props.className ?? ''}`}
		>{options}</Select>
	);
}
