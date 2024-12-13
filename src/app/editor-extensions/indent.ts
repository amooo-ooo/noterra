import { Extension } from "@tiptap/core";
import type { Editor, CommandProps } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		indent: {
			indent: () => ReturnType;
			outdent: () => ReturnType;
			increaseIndent: () => ReturnType;
			decreaseIndent: () => ReturnType;
			tab: () => ReturnType;
			untab: () => ReturnType;
		};
	}
}

export interface IndentOptions {
	types: string[];
}

export function isListItem(editor: Editor) {
	return (
		editor.isActive("bulletList") ||
		editor.isActive("orderedList") ||
		editor.isActive("todoList")
	)
}

export const Indent = Extension.create<IndentOptions>({
	name: "indent",

	addOptions() {
		return {
			types: ["heading", "paragraph"],
		};
	},

	addCommands() {
		const adjustIndent =
			(dedent: boolean, keyboard = false) =>
			({ tr, state, dispatch, editor, commands }: CommandProps) => {
				if (isListItem(editor)) {
					if (keyboard) return false;
					
					if (dedent) {
						commands.liftListItem("listItem")
					} else {
						commands.sinkListItem("listItem")
					}
					return true;
				}

				const { selection, doc } = state;
				const { from, to, anchor, head } = selection;
				const dir = dedent ? -1 : 1;

				let modified = 0;

				doc.nodesBetween(from, to, (node, pos) => {
				 if (this.options.types.includes(node.type.name)) {
						if (dedent) {
							if (
								keyboard &&
								selection.empty &&
								pos + 1 < head &&
								node.textContent[
									(selection.$head.textOffset || node.textContent.length) - 1
								] === "\t"
							)
								tr.delete(head - 1 + modified * dir, head + modified * dir);
							else if (
								node.textContent.startsWith("\t") &&
								(!selection.empty || pos + 1 < head)
							)
								tr.replaceWith(
									pos + 1 + modified * dir,
									pos + 2 + modified * dir,
									[],
								);
							else return;
						} else {
							if (keyboard && selection.empty) tr.insertText("\t");
							else tr.insertText("\t", pos + 1 + modified * dir);
							modified++;
						}
					}
				});

				if (modified && dispatch) {
					tr.setSelection(
						anchor > head
							? TextSelection.create(
									tr.doc,
									anchor + modified * dir,
									head + dir,
								)
							: TextSelection.create(
									tr.doc,
									anchor + dir,
									head + modified * dir,
								),
					);
					dispatch(tr);
				}

				return !!modified;
			};

		return {
			indent: () => adjustIndent(false),
			outdent: () => adjustIndent(true),
			increaseIndent:
				() =>
				({ commands }: CommandProps) =>
					commands.indent(),
			decreaseIndent:
				() =>
				({ commands }: CommandProps) =>
					commands.outdent(),
			tab: () => adjustIndent(false, true),
			untab: () => adjustIndent(true, true),
		};
	},

	addKeyboardShortcuts() {
		return {
			Tab: () => this.editor.commands.tab(),
			"Shift-Tab": () => this.editor.commands.untab(),
		};
	},
});
