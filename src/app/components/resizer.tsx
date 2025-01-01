import {
	add,
	parseSidedSizes,
	type SidedSizeProps,
	type CalcSize,
	type SidewiseProps,
	type Size,
	type VerticalAlign,
} from "@/app/css-util";
import React from "react";
import { ScrollContext } from "./global-listeners";

import styles from "@/app/styles/resizer.module.css";
import { EditorContext } from "./editor";
import { Option, Select } from "./select";
import { BringToFrontIcon, LetterTextIcon, WrapTextIcon } from "lucide-react";

export type Layout = {
	width: Size | "auto";
	height: Size | "auto";
	margin: Size;
} & (
	| {
			type: "inline";
			verticalAlign: VerticalAlign;
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
		width: (css.width as Size) || "auto",
		// css.width && css.width !== "auto"
		// 	? css.width === "100%"
		// 		? css.width
		// 		: Number.parseFloat(css.width)
		// 	: "auto",
		height: (css.height as Size) || "auto",
		// css.height && /^(\d+\.?|\d*\.\d+)(px|)$/.test(css.height)
		// 	? Number.parseFloat(css.height)
		// 	: "auto",
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
	return {
		...base,
		type: "inline",
		verticalAlign: (css.verticalAlign as VerticalAlign) || "middle",
	};
}

export function layoutCss(layout: Layout): React.CSSProperties {
	const base = {
		width: layout.width,
		height: layout.height,
		margin: layout.margin,
	} satisfies React.CSSProperties;
	switch (layout.type) {
		case "inline":
			return {
				...base,
				verticalAlign: layout.verticalAlign,
			} satisfies React.CSSProperties;
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

function dragHandle(e: React.DragEvent) {
	e.stopPropagation();
	const img = new Image();
	img.src =
		"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
	e.dataTransfer.setDragImage(img, 0, 0);
	e.dataTransfer.effectAllowed = "none";
}

function ResizeWidget({
	maintainAspectRatio,
	rect,
	updateRect,
	commitLayout,
	layout,
	setLayout,
	setOpen,
}: {
	maintainAspectRatio?: boolean;
	rect: DOMRect | undefined;
	updateRect: () => void;
	commitLayout: () => void;
	layout: Layout;
	setLayout: (value: Layout) => void;
	setOpen: (open: boolean) => void;
}) {
	const scrollState = React.useContext(ScrollContext);

	React.useEffect(() => {
		if (scrollState) updateRect();
	}, [scrollState, updateRect]);

	return (
		<div
			popover="auto"
			onToggle={(el) => {
				if (!el.currentTarget.matches(":popover-open")) setOpen(false);
			}}
			ref={(el) => el?.showPopover()}
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
					onDragStart={dragHandle}
					onDrag={(e) => {
						if (!e.pageX && !e.pageY) return;
						setLayout({
							...layout,
							width: e.pageX - (rect?.left ?? 0),
						});
					}}
					onDragEnd={commitLayout}
				>
					<div className={styles["handle-sq"]} />
				</div>
				<div className={styles.sw}>
					<div className={styles["handle-sq"]} />
				</div>
				<div
					className={styles.s}
					onDragStart={dragHandle}
					onDrag={(e) => {
						if (!e.pageX && !e.pageY) return;
						setLayout({
							...layout,
							height: e.pageY - (rect?.top ?? 0),
						});
					}}
					onDragEnd={commitLayout}
				>
					<div className={styles["handle-sq"]} />
				</div>
				<div
					className={styles.se}
					draggable
					onDragStart={dragHandle}
					onDrag={(e) => {
						if (!e.pageX && !e.pageY) return;
						if (maintainAspectRatio && !e.shiftKey) {
							const ratio = rect ? rect.width / rect.height : 1;
							const minDim = Math.min(
								e.pageX - (rect?.left ?? 0),
								(e.pageY - (rect?.top ?? 0)) * ratio,
							);
							setLayout({
								...layout,
								width: minDim,
								height: minDim / ratio,
							});
						} else {
							setLayout({
								...layout,
								width: e.pageX - (rect?.left ?? 0),
								height: e.pageY - (rect?.top ?? 0),
							});
						}
					}}
					onDragEnd={commitLayout}
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
									verticalAlign: "middle",
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
						commitLayout();
					}}
				>
					<Option value="inline" label={<LetterTextIcon size="1.5em" />} />
					<Option value="wrap" label={<WrapTextIcon size="1.5em" />} />
					<Option value="absolute" label={<BringToFrontIcon size="1.5em" />} />
				</Select>
			</div>
		</div>
	);
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

	const [_layout, _setLayout] = React.useState(layout);
	React.useEffect(() => _setLayout(layout), [layout]);
	const commitLayout = React.useCallback(
		() => setLayout(_layout),
		[setLayout, _layout],
	);
	const style = React.useMemo(() => layoutCss(_layout), [_layout]);

	const [rect, setRect] = React.useState<DOMRect>();
	const updateRect = React.useCallback(
		() => setRect(containerEl.current?.getBoundingClientRect()),
		[],
	);
	React.useEffect(() => {
		if (
			!containerEl.current ||
			layout.width !== "auto" ||
			layout.height !== "auto"
		)
			return;
		const observer = new ResizeObserver(() => updateRect());
		observer.observe(containerEl.current);
		return () => observer.disconnect();
	}, [layout, updateRect]);

	const [open, setOpen] = React.useState(false);

	// TODO: own tab handling (tiptap acts as if its inline text, jank)
	return (
		<span
			style={style}
			ref={containerEl}
			onClick={() => editor.locked || setOpen(true) || updateRect()}
			onKeyUp={(e) => {
				if (e.key === "Enter" && !editor.locked) {
					setOpen(true);
					updateRect();
				}
			}}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
			tabIndex={0}
			className={styles.container}
		>
			{children}
			{open ? (
				<ResizeWidget
					{...{
						maintainAspectRatio,
						rect,
						updateRect,
						commitLayout,
						setOpen,
					}}
					layout={_layout}
					setLayout={(layout) => {
						_setLayout(layout);
						updateRect();
					}}
				/>
			) : undefined}
		</span>
	);
}
