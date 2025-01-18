import { mergeAttributes, Node } from "@tiptap/core";
export const DebugFallbackRenderer = Node.create({
	name: "debug-fallback-renderer",

	content: "text*",
	group: "block",
	defining: true,

	priority: -1000,

	addAttributes() {
		return {
			content: {
				default: '',
				parseHTML(element) {
					return element.outerHTML;
				},
			}
		};
	},

	parseHTML() {
		return [{ tag: "*:not(div, span, thead, tbody)" }];
	},

	renderHTML({ node, HTMLAttributes }) {
		return ["div", mergeAttributes({ style: 'color: red;' }, HTMLAttributes), node.attrs.content];
	},
});
