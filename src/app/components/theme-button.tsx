import React from "react";
import { Moon, Sun } from "lucide-react";
import { ThemeContext } from "./global-listeners";

export function ThemeButton({
	size,
	...props
}: Omit<React.HTMLProps<HTMLButtonElement>, "size"> & {
	size?: React.CSSProperties["fontSize"];
}) {
	const { dark, setDark } = React.useContext(ThemeContext);

	return (
		<button
			{...props}
			type="button"
			title={`Switch to ${dark ? "light" : "dark"} mode`}
			onClick={(e) => {
				setDark(!dark);
				props.onClick?.(e);
			}}
		>
			{dark ? <Sun size={size} /> : <Moon size={size} />}
		</button>
	);
}
