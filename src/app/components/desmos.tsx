import React from "react";
import Desmos from "desmos";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import style from "@/app/styles/desmos-extension.module.scss";

export function DesmosGraph({ node, extension }: NodeViewProps) {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const calculatorRef = React.useRef<Desmos.GraphingCalculator | null>(null);

	let colorIndex = 0;

	const getNextColor = () => {
		const color = extension.options.lineColors[colorIndex];
		colorIndex = (colorIndex + 1) % extension.options.lineColors.length;
		return color;
	};

	React.useEffect(() => {
		if (!containerRef.current) return;

		calculatorRef.current = Desmos.GraphingCalculator(containerRef.current);

		for (const { latex, lineStyle, color } of node.attrs.expressions) {
			calculatorRef.current.setExpression({
				latex: latex,
				lineStyle: lineStyle ?? extension.options.defaultLineStyle,
				color: color || getNextColor(),
			});
		}

		return () => {
			calculatorRef.current?.destroy();
			calculatorRef.current = null;
		};
	}, [node.attrs.expressions]);

	return (
		<NodeViewWrapper>
			<div ref={containerRef} className={style.desmos} contentEditable="false"/>
		</NodeViewWrapper>
	);
}
