import React from "react";

export const WindowSize = React.createContext<readonly [number, number]>(null!);
export function WindowSizeProvider({ children }: React.PropsWithChildren<object>) {
	const [windowSize, setWindowSize] = React.useState([
		window.innerWidth,
		window.innerHeight,
	] as const);

	React.useEffect(() =>
		window.addEventListener("resize", () =>
			setWindowSize([window.innerWidth, window.innerHeight]),
		),
	);
	return <WindowSize.Provider value={windowSize}>{children}</WindowSize.Provider>
}
