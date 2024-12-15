import React, { useEffect } from "react";
import { Option, SelectPopover, SelectState } from "./select";

type ContextMenuItems = {
	label?: React.ReactNode;
	name: string;
	disabled?: boolean;
	action(): void;
}[];

type ContextMenuProps<T extends HTMLElement> = {
	menu: ContextMenuItems;
	wrapperNode: React.ReactElement<React.HTMLProps<T>>;
};

export function ContextMenuArea<T extends HTMLElement>({
	menu,
	children,
	wrapperNode,
}: React.PropsWithChildren<ContextMenuProps<T>>) {
	const id = React.useId();
	const [searchingValue, setSearchingValue] = React.useState("");
	// biome-ignore lint/correctness/useExhaustiveDependencies: very intentional
	const map = React.useMemo<React.ContextType<typeof SelectState>["map"]>(
		() => ({}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[searchingValue],
	);
	const searchField = React.useRef<HTMLInputElement | null>(null);
	const [popoverEl, setPopoverEl] = React.useState<HTMLDivElement | null>(null);
	const updatePosition = React.useRef<((rect?: DOMRect) => void) | null>(null);

	const [open, setOpen] = React.useState<DOMRect>();
	useEffect(() => {
		if (open) {
			updatePosition.current?.(open);
			popoverEl?.showPopover();
		}
	}, [open, popoverEl]);

	const options = React.useMemo(
		() =>
			menu.map((item) => (
				<Option
					key={item.name}
					value={item.name}
					label={item.label}
					disabled={item.disabled}
				/>
			)),
		[menu],
	);

	return React.cloneElement(wrapperNode, {
		onContextMenu: (e) => {
			e.preventDefault();
			e.stopPropagation();
			setOpen(new DOMRect(e.clientX, e.clientY, 0, 0));
		},
		children: (
			<>
				{children}
				{open ? (
					<SelectState.Provider
						value={{
							id,
							onChange: (value) => menu.find((x) => x.name === value)?.action(),
							searchingValue,
							setSearchingValue,
							map,
							searchField,
						}}
					>
						<SelectPopover
							id={id}
							updatePosition={updatePosition}
							display="vertical"
							onToggleOpen={(open) => {
								if (!open) setOpen(undefined);
							}}
							anchorEl={{ current: null }}
							ref={setPopoverEl}
							closeOnFocusExit={false}
							// onToggleOpen={(open) => {
							// 	onToggleOpen?.(open);
							// 	setOpen(open);
							// }}
							beforeContent={
								<input
									type="search"
									ref={searchField}
									value={searchingValue}
									onChange={(e) => setSearchingValue(e.currentTarget.value)}
									onFocus={(e) =>
										e.currentTarget.parentElement?.scrollTo({ top: 0 })
									}
									style={{
										// https://www.a11yproject.com/posts/how-to-hide-content/
										contain: "strict",
										clipPath: "inset(50%)",
										position: "absolute",
										overflow: "hidden",
										width: 1,
										height: 1,
									}}
								/>
							}
							noResultMessage={(search) => (
								<>No results matching &lsquo;{search}&rsquo;</>
							)}
						>
							{options}
						</SelectPopover>
					</SelectState.Provider>
				) : undefined}
			</>
		),
	});
}
