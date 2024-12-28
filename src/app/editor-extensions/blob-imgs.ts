import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BlobImageWrapper } from "./blob-image-wrapper";
import {
	type Layout,
	layoutCss,
	layoutFromCss,
} from "@/app/components/resizer";

export const BlobImages = Image.extend({
	addAttributes() {
		const attrs = this.parent?.() ?? {};
		return {
			...attrs,
			isBlob: {
				default: false,
				parseHTML: (el) => !!el.dataset.blobSrc,
				rendered: false,
				// renderHTML: (attrs) =>
				// 	attrs.isBlob ? { "data-blob-src": attrs.src } : { src: attrs.src },
			},
			src: {
				...("src" in attrs ? (attrs.src as object) : {}),
				parseHTML(el) {
					return el.dataset.blobSrc ?? (el as HTMLImageElement).src;
				},
				renderHTML: (attrs) =>
					attrs.isBlob ? { "data-blob-src": attrs.src } : { src: attrs.src },
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
		return [...(this.parent?.() ?? []), { tag: "img[data-blob-src]" }];
	},

	addNodeView() {
		return ReactNodeViewRenderer(BlobImageWrapper, {
			className: "node-blob-image",
		});
	},
});
