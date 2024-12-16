"use client";

import type DesmosType from "./_desmos"; // IMPORTANT: this is type-only, value inited lazily
import React, { Suspense } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import style from "@/app/styles/desmos-extension.module.scss";

function DesmosGraphImpl({
	node,
	extension,
	Desmos,
}: NodeViewProps & { Desmos: typeof DesmosType }) {
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
				ref={(el) => setCalculator(el && Desmos.GraphingCalculator(el))}
				className={style.desmos}
			/>
		</NodeViewWrapper>
	);
}

let _desmos: typeof DesmosType;
async function DesmosLoader(props: NodeViewProps) {
	// biome-ignore lint/suspicious/noAssignInExpressions: lazy default initializer
	const Desmos = (_desmos ??= (await import("./_desmos")).default);
	return <DesmosGraphImpl {...props} Desmos={Desmos} />;
}

export function DesmosGraph(props: NodeViewProps) {
	return (
		<Suspense
			fallback={
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
					}}
				>
					Loading Desmos...
				</div>
			}
		>
			<DesmosLoader {...props} />
		</Suspense>
	);
}
