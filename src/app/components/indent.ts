import { Extension, type CommandProps } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		indent: {
			indent: () => ReturnType;
			outdent: () => ReturnType;
			increaseIndent: () => ReturnType;
			decreaseIndent: () => ReturnType;
		};
	}
}

export interface IndentOptions {
	types: string[];
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
			(adjustment: (text: string) => string, cursorOffset: number) =>
			({ tr, state, dispatch }: CommandProps) => {
				const { selection, schema, doc } = state;
				const { from, to, anchor, head } = selection;

				let modified = false;

				doc.nodesBetween(from, to, (node, pos) => {
					if (this.options.types.includes(node.type.name)) {
						const originalText = node.textContent ?? "";
						const newText = adjustment(originalText);

						if (newText === originalText || newText === "") return;

						tr.replaceWith(
							pos + 1,
							pos + node.nodeSize - 1,
							schema.text(newText),
						);
						modified = true;
					}
				});

				if (modified && dispatch) {
					tr.setSelection(
						TextSelection.create(
							tr.doc,
							anchor + cursorOffset,
							head + cursorOffset,
						),
					);
					dispatch(tr);
				}

				return modified;
			};

		return {
			indent: () => adjustIndent((text) => `\t${text}`, 1),
			outdent: () =>
				adjustIndent(
					(text) => (text.startsWith("\t") ? text.slice(1) : text),
					-1,
				),
			increaseIndent:
				() =>
				({ commands }: CommandProps) =>
					commands.indent(),
			decreaseIndent:
				() =>
				({ commands }: CommandProps) =>
					commands.outdent(),
		};
	},

	addKeyboardShortcuts() {
		return {
			Tab: () => this.editor.commands.indent(),
			"Shift-Tab": () => this.editor.commands.outdent(),
		};
	},
});
