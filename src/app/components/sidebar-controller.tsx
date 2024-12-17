import React from "react";
import styles from "@/app/styles/sidebar-controller.module.scss";

declare module "react" {
	interface CSSProperties {
		[key: `--${string}`]: string | number;
	}
}

function pageReducer(
	state: {
		id: number;
		children: readonly [React.ReactNode, React.ReactNode];
	},
	action: React.ReactNode,
) {
	return {
		id: state.id + 1,
		children: [state.children[1], action] as const,
	};
}

export const usePages = () =>
	React.useReducer(pageReducer, {
		id: 0,
		children: [undefined, undefined],
	});

export function SidebarController({
	right,
	pages,
}: {
	right?: boolean;
	pages: React.ReducerState<typeof pageReducer>;
}) {
	const [width, setWidth] = React.useState(300);
	const resizeController = (
		<div
			className={styles["resize-controller"]}
			draggable
			onDragStart={(e) => {
				// e.preventDefault();
				const img = new Image();
				img.src =
					"data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
				e.dataTransfer.setDragImage(img, 0, 0);
			}}
			onDrag={(e) => {
				const rect = right
					? e.currentTarget.nextElementSibling?.getBoundingClientRect()
					: e.currentTarget.previousElementSibling?.getBoundingClientRect();
				if (!rect || (!e.pageX && !e.pageY)) return;
				setWidth(right ? rect.x + rect.width - e.pageX : e.pageX - rect.x);
			}}
		/>
	);
	return (
		<>
			{pages.children[1] && right ? resizeController : undefined}
			<div
				className={`${styles.sidebar} ${pages.children[1] ? styles.open : ""}`}
				style={{
					"--width": width,
					...(pages.children[1]
						? {}
						: { borderInline: "1px solid var(--border-color)" }),
				}}
			>
				{pages.children.map((child, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: very intentional
					<div className={styles["sidebar-page"]} key={pages.id + i}>
						{child}
					</div>
				))}
			</div>
			{pages.children[1] && !right ? resizeController : undefined}
		</>
	);
}
