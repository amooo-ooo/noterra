"use client";

import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
// import Desmos from "desmos";
import "desmos";
import React from "react";
import style from "@/app/styles/desmos-extension.module.scss";
import type { DesmosOptions } from "@/app/editor-extensions/desmos-node-extension";

export type DesmosExpression = {
	latex: string;
	color?: string;
	lineStyle?: "solid" | "dashed" | "dotted";
};

export function DesmosGraph({ node, extension }: NodeViewProps) {
	const calculator = React.useRef<Desmos.Calculator | null>(null);
	const options = extension.options as DesmosOptions;

	React.useEffect(() => {
		if (!calculator.current) return;

		let colorIndex = 0;
		const getNextColor = () => {
			const color = options.lineColors[colorIndex];
			colorIndex++;
			colorIndex %= options.lineColors.length;
			return color;
		};

		// calculator.setState(obj);
		calculator.current.setExpressions(
			(node.attrs.expressions as DesmosExpression[]).map((expr) => ({
				...expr,
				lineStyle: {
					solid: Desmos.Styles.SOLID,
					dashed: Desmos.Styles.DASHED,
					dotted: Desmos.Styles.DOTTED,
				}[expr.lineStyle ?? options.defaultLineStyle],
				color: expr.color || getNextColor(),
			})),
		);
	}, [node.attrs.expressions, options.defaultLineStyle, options.lineColors]);

	React.useEffect(
		() => {
			// TODO: update attributes with new desmos state
			// calculator?.observeEvent("change", () => {
			// 	updateAttributes({ expressions: calculator.getExpressions() });
			// });
		},
		[
			/* calculator */
		],
	);

	return (
		<NodeViewWrapper>
			<div
				ref={(el) => {
					calculator.current = el && Desmos.GraphingCalculator(el);
				}}
				className={style.desmos}
			/>
		</NodeViewWrapper>
	);
}

// export function DesmosGraph(props: NodeViewProps) {
// 	return (
// 		<NodeViewWrapper>
// 			{/* <Suspense
// 				fallback={
// 					<div
// 						style={{
// 							display: "flex",
// 							alignItems: "center",
// 							justifyContent: "center",
// 							height: "100%",
// 						}}
// 					>
// 						Loading Desmos...
// 					</div>
// 				}
// 			> */}
// 			<DesmosGraphImpl {...props} />
// 			{/* </Suspense> */}
// 		</NodeViewWrapper>
// 	);
// }
