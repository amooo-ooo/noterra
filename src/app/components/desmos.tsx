"use client";

import React from "react";
import Desmos from "desmos";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import style from "@/app/styles/desmos-extension.module.scss";

export function DesmosGraph({
	node,
	extension,
}: NodeViewProps) {
	const [calculator, setCalculator] = React.useState<Desmos.Calculator | null>(
		null,
	);

	React.useEffect(() => {
		if (!calculator) return;

		let colorIndex = 0;
		const getNextColor = () => {
			const color = extension.options.lineColors[colorIndex];
			colorIndex++;
			colorIndex %= extension.options.lineColors.length;
			return color;
		};

		// calculator.setState(obj);
		calculator.setExpressions(
			(
				node.attrs.expressions as {
					latex: string;
					lineStyle?: string;
					color?: string;
				}[]
			).map((expr) => ({
				...expr,
				lineStyle: expr.lineStyle ?? extension.options.defaultLineStyle,
				color: expr.color || getNextColor(),
			})),
		);
	}, [
		node.attrs.expressions,
		extension.options.defaultLineStyle,
		extension.options.lineColors,
		calculator,
	]);

	React.useEffect(() => {
		// TODO: update attributes with new desmos state
		// calculator?.observeEvent("change", () => {
		// 	updateAttributes({ expressions: calculator.getExpressions() });
		// });
	});

	return (
		<NodeViewWrapper>
			<div
				ref={(el) => setCalculator(el && Desmos.GraphingCalculator(el))}
				className={style.desmos}
			/>
		</NodeViewWrapper>
	);
}
