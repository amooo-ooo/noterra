import { mergeAttributes, Node, ReactNodeViewRenderer } from "@tiptap/react";
import { SVGNodeWrapper } from "./svg-node-wrapper";
import { type Layout, layoutCss, layoutFromCss } from "@/app/components/resizer";


export interface SVGOptions {
	/**
	 * Controls if the SVG node should be inline or not.
	 * @default false
	 * @example true
	 */
	inline: boolean,

	/**
	 * HTML attributes to add to the svg element.
	 * @default {}
	 * @example { class: 'foo' }
	 */
	HTMLAttributes: Record<string, unknown>,
}

export const SVGExtension = Node.create<SVGOptions>({
	name: 'svg',

	addOptions() {
		return {
			inline: false,
			HTMLAttributes: {},
		};
	},

	inline() {
		return this.options.inline;
	},

	group() {
		return this.options.inline ? 'inline' : 'block';
	},

	draggable: true,

	addAttributes() {
		return {
			content: {
				default: "",
				parseHTML(element) {
					return element.innerHTML;
				},
			},
			alt: {
				default: null,
			},
			title: {
				default: null,
			},
			layout: {
				default: {
					type: "inline",
					width: "auto",
					height: "auto",
					margin: 0,
				} satisfies Layout,
				parseHTML(el) {
					return layoutFromCss(el.style);
				},
				renderHTML(attributes) {
					return {
						style: Object.entries(layoutCss(attributes.layout))
							.map(
								([attr, val]) =>
									`${attr.replaceAll(
										/[A-Z]/g,
										(match) => `-${match.toLowerCase()}`,
									)}: ${val};`,
							)
							.join(""),
					};
				},
			},
		};
	},

	parseHTML() {
		return [{ tag: 'svg' }];
	},

	renderHTML({ node, HTMLAttributes }) {
		const inner = document.createElement('svg');
		inner.innerHTML = node.attrs.content;
		return ['svg', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ...inner.childNodes];
	},

	addNodeView() {
		return ReactNodeViewRenderer(SVGNodeWrapper, {
			className: "node-blob-image",
		});
	},
});
