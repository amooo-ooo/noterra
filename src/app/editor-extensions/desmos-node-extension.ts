import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import dynamic from "next/dynamic";

// TYPE ONLY IMPORT
import type { DesmosExpression } from "@/app/components/desmos";
const DesmosGraph = dynamic(
	async () => (await import("@/app/components/desmos")).DesmosGraph,
	{
		ssr: false,
	},
);

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		desmosGraph: {
			setDesmosGraph: (expressions: DesmosExpression[]) => ReturnType;
		};
	}
}

export interface DesmosOptions {
	defaultLineStyle: NonNullable<DesmosExpression["lineStyle"]>;
	lineColors: NonNullable<DesmosExpression["color"]>[];
	HTMLAttributes: Record<string, unknown>;
}

export const DesmosGraphExtension = Node.create<DesmosOptions>({
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

	renderHTML() {
		// TODO: render *something* persistant and usable
		return "<desmos graph>";
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
