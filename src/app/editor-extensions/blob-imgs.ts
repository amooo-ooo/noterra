import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BlobImageWrapper } from "./blob-image-wrapper";

export const BlobImages = Image.extend({
	addAttributes() {
		const attrs = this.parent?.() ?? {};
		return {
			...attrs,
			isBlob: {
				default: false,
				parseHTML: (el) => !!el.dataset.blobSrc,
				renderHTML: (attrs) =>
					attrs.isBlob ? { "data-blob-src": attrs.src } : { src: attrs.src },
			},
			src: {
				...("src" in attrs ? (attrs.src as object) : {}),
				parseHTML(el) {
					return el.dataset.blobSrc ?? (el as HTMLImageElement).src;
				},
				// renderHTML: attrs => attrs.isBlob ? { 'data-blob-src': attrs.src } : { src: attrs.src },
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
