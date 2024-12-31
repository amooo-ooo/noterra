import {
	NodeViewContent,
	type NodeViewProps,
	NodeViewWrapper,
} from "@tiptap/react";
import React from "react";

export function PageRenderer({
	// editor,
	node,
	// decorations,
	// selected,
	// extension,
	// getPos,
	updateAttributes,
	// deleteNode,
}: NodeViewProps) {
	const [inView, setInView] = React.useState(true);
	const _inView = React.useRef(inView);
	React.useImperativeHandle(_inView, () => inView, [inView]);

	const wrapper = React.useRef<HTMLElement | null>(null);

	console.log("render", wrapper.current, inView);
	React.useEffect(() => {
		if (!wrapper.current) return;
		const viewObserver = new IntersectionObserver(
			(xions) => {
				for (const xion of xions) {
					if (xion.isIntersecting !== _inView.current) {
						console.log("intersectUpdate on", xion.isIntersecting, xion.target);
						setInView(xion.isIntersecting);
					}
				}
			},
			{
				threshold: 0,
			},
		);
		viewObserver.observe(wrapper.current);
		const sizeObserver = new ResizeObserver((updates) => {
			if (!_inView.current) return;
			for (const update of updates) {
				console.log("resize on", update.target, update.contentRect);
				updateAttributes({
					width:
						update.borderBoxSize?.[0]?.inlineSize ?? update.contentRect.width,
					height:
						update.borderBoxSize?.[0]?.blockSize ?? update.contentRect.height,
				});
			}
		});
		sizeObserver.observe(wrapper.current);
		return () => {
			viewObserver.disconnect();
			sizeObserver.disconnect();
		};
	}, [updateAttributes]);

	return (
		<NodeViewWrapper>
			<section
				ref={wrapper}
				style={{
					width: node.attrs.width || 800,
					height: inView ? "auto" : node.attrs.height,
				}}
			>
				{inView || !node.attrs.height ? (
					<NodeViewContent />
				) : (
					<button
						type="button"
						onClick={() => {
							wrapper.current?.scrollIntoView({ behavior: "instant" });
							setInView(true);
						}}
					>
						Show page contents
					</button>
				)}
			</section>
		</NodeViewWrapper>
	);
}
