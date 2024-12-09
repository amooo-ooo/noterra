import React, { useEffect } from "react";
import styles from "@/app/styles/theme-button.module.css";
import { Moon, Sun } from "lucide-react";

export function ThemeButton({
	size,
	...props
}: Omit<React.HTMLProps<HTMLButtonElement>, "size"> & {
	size?: React.CSSProperties["fontSize"];
}) {
	const [state, setState] = React.useState(
		() => window.matchMedia("(prefers-color-scheme: dark)").matches,
	);

	useEffect(() => {
		// Jankness in order to avoid transitions while changing the theme colors
		// as this causes some inconsistent effects
		document.body.classList.add(styles["avoid-transition"]);
		document.body.style.colorScheme = state ? "dark" : "light";
		requestAnimationFrame(() =>
			document.body.classList.remove(styles["avoid-transition"]),
		);
	}, [state]);

	return (
		<button
			{...props}
			type="button"
			title={`Switch to ${state ? "light" : "dark"} mode`}
			onClick={(e) => {
				setState(!state);
				props.onClick?.(e);
			}}
		>
			{state ? <Sun size={size} /> : <Moon size={size} />}
		</button>
	);
}
