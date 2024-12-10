"use client";

import React from "react";
import styles from "@/app/styles/global-listeners.module.css";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export const WindowSize = React.createContext<readonly [number, number]>(null!);
export function WindowSizeProvider({
	children,
}: React.PropsWithChildren<object>) {
	const [windowSize, setWindowSize] = React.useState([
		window.innerWidth,
		window.innerHeight,
	] as const);

	React.useEffect(() =>
		window.addEventListener("resize", () =>
			setWindowSize([window.innerWidth, window.innerHeight]),
		),
	);
	return (
		<WindowSize.Provider value={windowSize}>{children}</WindowSize.Provider>
	);
}

export const ActiveElement = React.createContext<Element | null>(null);
export function ActiveElementProvider({
	children,
}: React.PropsWithChildren<object>) {
	const [activeElement, setActiveElement] = React.useState(
		document.activeElement,
	);

	React.useEffect(() =>
		document.addEventListener(
			"focus",
			() => setActiveElement(document.activeElement),
			{ capture: true },
		),
	);
	return (
		<ActiveElement.Provider value={activeElement}>
			{children}
		</ActiveElement.Provider>
	);
}

export const ThemeContext = React.createContext<{
	dark: boolean;
	setDark: (value: boolean) => void;
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
}>(null!);

export function ThemeProvider({ children }: React.PropsWithChildren<object>) {
	const [dark, setDark] = React.useState(
		() => window.matchMedia("(prefers-color-scheme: dark)").matches,
	);

	React.useEffect(() => {
		// Jankness in order to avoid transitions while changing the theme colors
		// as this causes some inconsistent effects
		document.body.classList.add(styles["avoid-transition"]);
		document.body.style.colorScheme = dark ? "dark" : "light";
		requestAnimationFrame(() =>
			document.body.classList.remove(styles["avoid-transition"]),
		);
	}, [dark]);

	return (
		<ThemeContext.Provider value={{ dark, setDark }}>
			{children}
		</ThemeContext.Provider>
	);
}
