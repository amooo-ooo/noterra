import { Command, Extension, CommandProps, ChainedCommands } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      increaseIndentCommand: () => boolean;
      decreaseIndentCommand: () => boolean;
      increaseIndent: () => ChainedCommands;
      decreaseIndent: () => ChainedCommands;
    };
  }
}

export interface IndentOptions {
  types: string[];
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
    };
  },

  addCommands() {
    const adjustIndent =
      (adjustment: (text: string) => string): Command =>
        ({ tr, state, dispatch }: CommandProps) => {
          const { selection, schema, doc } = state;
          const { from, to } = selection;
          let modified = false;

          doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const originalText = node.textContent ?? '';
              const newText = adjustment(originalText);

              if (newText !== originalText) {
                tr.replaceRangeWith(pos, pos + node.nodeSize, schema.text(newText));
                modified = true;
              }
            }
          });

          if (modified && dispatch) {
            tr.setMeta('addToHistory', true);
            dispatch(tr);
          }

          return modified;
        };

    return {
      increaseIndentCommand: () => adjustIndent(text => `\t${text}`),
      decreaseIndentCommand: () => adjustIndent(text => text.startsWith('\t') ? text.slice(1) : text),
      increaseIndent: () => ({ commands }: CommandProps) => commands.increaseIndentCommand(),
      decreaseIndent: () => ({ commands }: CommandProps) => commands.decreaseIndentCommand(),
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.increaseIndentCommand(),
      'Shift+Tab': () => this.editor.commands.decreaseIndentCommand(),
    };
  },
});
