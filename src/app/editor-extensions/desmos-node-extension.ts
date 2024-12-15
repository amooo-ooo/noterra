import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DesmosGraph } from "../components/desmos";

export type DesmosExpression = {
    latex: string;
    color?: string;
    lineStyle?: "solid" | "dashed" | "dotted";
};

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        desmosGraph: {
            setDesmosGraph: (expressions: DesmosExpression[]) => ReturnType;
        };
    }
}

export const DesmosGraphExtension = Node.create({
    name: "desmosGraph",

    addOptions() {
        return {
            defaultLineStyle: "solid",
            lineColors: [
                "#6042a6",
                "#000000",
                "#c74440",
                "#2d70b3",
                "#388c46",
                "#fa7e19",
            ],
            HTMLAttributes: {},
        };
    },

    content: "text*",
    group: "block",
    inline: false,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            expressions: { default: [] as DesmosExpression[] },
        };  
    },

    addNodeView() {
        return ReactNodeViewRenderer(DesmosGraph);
    },

    addCommands() {
        return {
            setDesmosGraph:
                (expressions: DesmosExpression[]) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: { expressions },
                        });
                    },
        };
    },
});
