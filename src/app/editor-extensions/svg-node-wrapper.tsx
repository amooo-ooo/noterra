import React from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Resizer, type Layout } from "@/app/components/resizer";

export function SVGNodeWrapper({
	// editor,
	node,
	// decorations,
	// selected,
	// extension,
	// getPos,
	updateAttributes,
	// deleteNode,
}: NodeViewProps) {
	return (
		<NodeViewWrapper>
			<Resizer
				layout={node.attrs.layout as Layout}
				setLayout={(l) => updateAttributes({ layout: l })}
				maintainAspectRatio
			>
				<span title={node.attrs.title}>
					<svg
						aria-label={node.attrs.alt}
						style={{ width: "100%", height: "100%" }}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
						dangerouslySetInnerHTML={{ __html: node.attrs.content }}
					/>
				</span>
			</Resizer>
		</NodeViewWrapper>
	);
}
