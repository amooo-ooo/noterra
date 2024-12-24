import CharacterCount, {
	type CharacterCountOptions,
} from "@tiptap/extension-character-count";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";

export interface SelCharCountStorage {
	/**
	 * Get the number of characters for the current document.
	 * @param options The options for the character count. (optional)
	 * @param options.node The node to get the characters from. Defaults to the current document.
	 * @param options.mode The mode by which the size is calculated. If set to `textSize`, the textContent of the document is used.
	 */
	characters: (options?: {
		node?: ProseMirrorNode | Selection;
		mode?: "textSize" | "nodeSize";
	}) => number;

	/**
	 * Get the number of words for the current document.
	 * @param options The options for the character count. (optional)
	 * @param options.node The node to get the words from. Defaults to the current document.
	 */
	words: (options?: { node?: ProseMirrorNode | Selection }) => number;
}

export const SelCharCount = CharacterCount.extend<
	CharacterCountOptions,
	SelCharCountStorage
>({
	onBeforeCreate() {
		this.parent?.();

		const { characters, words } = this.storage;
		this.storage.characters = (options) => {
			if (
				(!options?.node && !this.editor.state.selection.empty) ||
				options?.node instanceof Selection
			) {
				const sel =
					(options?.node as Selection | undefined) ??
					this.editor.state.selection;
				if (options?.mode === "nodeSize") return sel.content().size;
				return this.options.textCounter(
					this.editor.state.doc.textBetween(sel.from, sel.to, "\n"),
				);
			}
			return characters(options);
		};
		this.storage.words = (options) => {
			if (
				(!options?.node && !this.editor.state.selection.empty) ||
				options?.node instanceof Selection
			) {
				const sel =
					(options?.node as Selection | undefined) ??
					this.editor.state.selection;
				return this.options.wordCounter(
					this.editor.state.doc.textBetween(sel.from, sel.to, "\n"),
				);
			}
			return words(options);
		};
	},
});
