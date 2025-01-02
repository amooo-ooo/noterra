import React from "react";
import { EditorContext } from "@/app/components/editor";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Resizer, type Layout } from "@/app/components/resizer";
import { IMAGE_THEMATIC_CLASS } from "./blob-imgs";

export function BlobImageWrapper({
	// editor,
	node,
	// decorations,
	// selected,
	// extension,
	// getPos,
	updateAttributes,
	// deleteNode,
}: NodeViewProps) {
	const state = React.useContext(EditorContext);
	const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
	React.useEffect(() => {
		if (!node.attrs.isBlob) return;
		const file = state.file.attachments[node.attrs.src as string];
		if (!file) return;
		const url = URL.createObjectURL(file);
		setBlobUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [node.attrs.src, node.attrs.isBlob, state.file.attachments]);

	return (
		<NodeViewWrapper
			style={
				{
					display: "inline-block",
				} satisfies React.CSSProperties
			}
		>
			<Resizer
				layout={node.attrs.layout as Layout}
				setLayout={(l) => updateAttributes({ layout: l })}
				maintainAspectRatio
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={node.attrs.isBlob ? blobUrl : node.attrs.src}
					alt={node.attrs.alt}
					title={node.attrs.title}
					className={node.attrs.isThematic ? IMAGE_THEMATIC_CLASS : undefined}
					style={{ width: "100%", height: "100%" }}
				/>
			</Resizer>
		</NodeViewWrapper>
	);
}
