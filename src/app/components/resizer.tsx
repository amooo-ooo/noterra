import {
	add,
	parseSidedSizes,
	type SidedSizeProps,
	type CalcSize,
	type SidewiseProps,
	type Size,
} from "@/app/css-util";
import React from "react";
import { ScrollContext } from "./global-listeners";

import styles from "@/app/styles/resizer.module.css";
import { EditorContext } from "./editor";
import { Option, Select } from "./select";
import { BringToFrontIcon, LetterTextIcon, WrapTextIcon } from "lucide-react";

export type Layout = {
	width: number | "100%" | "auto";
	height: number | "auto";
	margin: Size;
} & (
	| {
			type: "inline";
	  }
	| {
			type: "wrap";
			setting: { left: number } | { right: number };
	  } // float: {align}; margin as css
	| {
			type: "absolute";
			zIndex: number;
			setting: Partial<SidewiseProps<CalcSize>>;
	  } // position: absolute, etc. as css
);

export function layoutFromCss(css: CSSStyleDeclaration): Layout {
	const base = {
		width:
			css.width && css.width !== "auto"
				? css.width === "100%"
					? css.width
					: Number.parseFloat(css.width)
				: "auto",
		height:
			css.width && css.width !== "auto" ? Number.parseFloat(css.width) : "auto",
		margin: (css.margin as Size) || 0,
	} satisfies Partial<Layout>;
	// wrap
	if (css.float === "left" || css.float === "right") {
		const margins = parseSidedSizes(css.margin as SidedSizeProps);
		return {
			...base,
			margin: margins.top as Size, // just hope
			type: "wrap",
			setting: {
				[css.float]:
					Number.parseFloat(`${margins.left}`) -
					Number.parseFloat(`${margins.top}`),
			} as { left: number } | { right: number },
		};
	}
	// absolute
	if (css.position === "absolute")
		return {
			...base,
			type: "absolute",
			zIndex: Number.parseInt(css.zIndex || "0"),
			setting: parseSidedSizes(css.inset as SidedSizeProps),
		};
	return { ...base, type: "inline" };
}

export function layoutCss(layout: Layout): React.CSSProperties {
	const base = {
		width: layout.width,
		height: layout.height,
		margin: layout.margin,
	} satisfies React.CSSProperties;
	switch (layout.type) {
		case "inline":
			return base;
		case "wrap":
			return {
				...base,
				...("left" in layout.setting
					? ({
							marginLeft: add(layout.margin, layout.setting.left),
							float: "left",
						} satisfies React.CSSProperties)
					: ({
							marginRight: add(layout.margin, layout.setting.right),
							float: "right",
						} satisfies React.CSSProperties)),
			};
		case "absolute":
			return {
				...base,
				position: "absolute",
				...layout.setting,
			} satisfies React.CSSProperties;
	}
}

function clearDragImage(e: React.DragEvent) {
	const img = new Image();
	img.src =
		"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
	e.dataTransfer.setDragImage(img, 0, 0);
	e.dataTransfer.effectAllowed = "none";
}

export function Resizer({
	layout,
	setLayout,
	children,
	maintainAspectRatio,
}: React.PropsWithChildren<{
	layout: Layout;
	setLayout: (value: Layout) => void;
	maintainAspectRatio?: boolean;
}>) {
	const editor = React.useContext(EditorContext);
	const containerEl = React.useRef<HTMLSpanElement | null>(null);
	const popoverEl = React.useRef<HTMLDivElement | null>(null);

	const [_layout, _setLayout] = React.useState(layout);
	React.useEffect(() => {
		_setLayout(layout);
	}, [layout]);

	const style = React.useMemo(() => layoutCss(_layout), [_layout]);

	React.useContext(ScrollContext);
	const rect = containerEl.current?.getBoundingClientRect();
	React.useEffect(() => {
		if (
			!containerEl.current ||
			layout.width !== "auto" ||
			layout.height !== "auto"
		)
			return;
		const observer = new ResizeObserver(() => _setLayout(layout)); // Just force rerender
		observer.observe(containerEl.current);
		return () => observer.disconnect();
	}, [layout]);

	return (
		<span
			style={style}
			ref={containerEl}
			onClick={() => editor.locked || popoverEl.current?.showPopover()}
			onKeyUp={(e) => {
				if (e.key === "Enter" && !editor.locked) {
					popoverEl.current?.showPopover();
				}
			}}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
			tabIndex={0}
			className={styles.container}
		>
			{children}
			<div
				popover="auto"
				ref={popoverEl}
				style={{
					width: rect?.width ?? 0,
					height: rect?.height ?? 0,
					top: rect?.top ?? 0,
					left: rect?.left ?? 0,
				}}
				className={styles.popover}
			>
				<div className={styles["action-container"]}>
					{/* TODO: other handles should resize/move accordingly */}
					{/* for 'inline' this may not be sensible for the logical-start-side handles */}
					{/* float and absolute can modify their inset/margins to counter the growth */}
					{/* in order to keep the mouse on the handle. 'inline' may also be able to */}
					{/* handle this for the north handle when a scrollbar is present */}
					{/* also, figure a suitable alternative display/action in those places where */}
					{/* dragging is impossible - e.g. hide the .handle-sq's on those sides */}
					<div className={styles.nw}>
						<div className={styles["handle-sq"]} />
					</div>
					<div className={styles.n}>
						<div className={styles["handle-sq"]} />
					</div>
					<div className={styles.ne}>
						<div className={styles["handle-sq"]} />
					</div>
					<div className={styles.w}>
						<div className={styles["handle-sq"]} />
					</div>
					<div className={styles.c} draggable />
					<div
						className={styles.e}
						onDragStart={(e) => {
							e.stopPropagation();
							clearDragImage(e);
						}}
						onDrag={(e) => {
							if (!e.pageX && !e.pageY) return;
							_setLayout({
								...layout,
								width: e.pageX - (rect?.left ?? 0),
							});
						}}
						onDragEnd={() => setLayout(_layout)}
					>
						<div className={styles["handle-sq"]} />
					</div>
					<div className={styles.sw}>
						<div className={styles["handle-sq"]} />
					</div>
					<div
						className={styles.s}
						onDragStart={(e) => {
							e.stopPropagation();
							clearDragImage(e);
						}}
						onDrag={(e) => {
							if (!e.pageX && !e.pageY) return;
							_setLayout({
								...layout,
								height: e.pageY - (rect?.top ?? 0),
							});
						}}
						onDragEnd={() => setLayout(_layout)}
					>
						<div className={styles["handle-sq"]} />
					</div>
					<div
						className={styles.se}
						draggable
						onDragStart={(e) => {
							e.stopPropagation();
							clearDragImage(e);
						}}
						onDrag={(e) => {
							if (!e.pageX && !e.pageY) return;
							if (maintainAspectRatio && !e.shiftKey) {
								const ratio = rect ? rect.width / rect.height : 1;
								const minDim = Math.min(
									e.pageX - (rect?.left ?? 0),
									(e.pageY - (rect?.top ?? 0)) * ratio,
								);
								_setLayout({
									...layout,
									width: minDim,
									height: minDim / ratio,
								});
							} else {
								_setLayout({
									...layout,
									width: e.pageX - (rect?.left ?? 0),
									height: e.pageY - (rect?.top ?? 0),
								});
							}
						}}
						onDragEnd={() => setLayout(_layout)}
					>
						<div className={styles["handle-sq"]} />
					</div>
					<Select
						display="horizontal"
						value={layout.type}
						className={styles["layout-select"]}
						onChange={(type) => {
							switch (type) {
								case "inline":
									setLayout({
										type: "inline",
										width: layout.width,
										height: layout.height,
										margin: layout.margin,
									});
									break;
								case "wrap":
									setLayout({
										type: "wrap",
										width: layout.width,
										height: layout.height,
										margin: layout.margin,
										setting:
											"setting" in layout
												? "left" in layout.setting
													? {
															left: Number.parseFloat(`${layout.setting.left}`),
														}
													: "right" in layout.setting
														? {
																right: Number.parseFloat(
																	`${layout.setting.right}`,
																),
															}
														: { left: 0 }
												: { left: 0 },
									});
									break;
								case "absolute":
									setLayout({
										type: "absolute",
										width: layout.width,
										height: layout.height,
										margin: layout.margin,
										zIndex: 1,
										setting: "setting" in layout ? layout.setting : {},
									});
							}
						}}
					>
						<Option value="inline" label={<LetterTextIcon size="1.5em" />} />
						<Option value="wrap" label={<WrapTextIcon size="1.5em" />} />
						<Option
							value="absolute"
							label={<BringToFrontIcon size="1.5em" />}
						/>
					</Select>
				</div>
			</div>
		</span>
	);
}
