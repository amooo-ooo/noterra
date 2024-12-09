"use client";

import React from "react";

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
