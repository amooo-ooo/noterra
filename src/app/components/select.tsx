import React from "react";
import styles from "@/app/styles/select.module.scss";
import { ActiveElement, WindowSize } from "./global-listeners";
import { HANDLES_CHARS } from "./editor";

export type OptionProps = {
	label?: React.ReactNode;
	value: string;
	valueAliases?: string[];
	disabled?: boolean;
	style?: React.CSSProperties;
};

function match(search: string, aliases: string[]) {
	if (!search) return { in: aliases[0], matches: [], score: 0 };
	// TODO: replace with better fuzzier search algorithm
	// GUARANTEES:
	// - returned parts will NOT overlap
	// - returned parts will be in order of appearance
	for (const alias of aliases) {
		const idx = alias.toLowerCase().indexOf(search.toLowerCase());
		if (idx >= 0) {
			return {
				in: alias,
				matches: [[idx, idx + search.length]],
				score: idx === 0 ? 10 : 0,
			};
		}
	}
}

const SelectState = React.createContext<{
	id: string;
	value?: string;
	onChange?: (value: string) => void;
	searchingValue: string;
	setSearchingValue: (value: string) => void;
	searchField?: React.RefObject<HTMLInputElement | null>;
	map: {
		[key: string]: {
			props: OptionProps;
			matches: NonNullable<ReturnType<typeof match>>;
		};
	};
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
}>(null!);

function safe_id(id: string) {
	return id.replaceAll(/\W/g, "-");
}

export function Option({ label, value, disabled, style }: OptionProps) {
	const state = React.useContext(SelectState);
	const nodes = React.useMemo(() => {
		const matches = state.map[value]?.matches;
		if (!matches) return;
		if (!matches.matches.length) return <>{label ?? value}</>;
		const arr: (string | React.ReactElement)[] = [...matches.in];
		for (const match of matches.matches.toReversed()) {
			arr.splice(
				match[0],
				match[1] - match[0],
				<span key={match[0]} className={styles.highlight}>
					{arr.slice(match[0], match[1])}
				</span>,
			);
		}
		return matches.in === (label ?? value) ? (
			<span>{arr}</span>
		) : (
			<>
				{label ?? value}
				<span className={styles.sub}>{arr}</span>
			</>
		);
	}, [state.map, label, value]);
	if (!nodes) return <></>;
	return (
		<>
			<input
				type="radio"
				checked={state.value === value}
				disabled={disabled}
				id={`${state.id}_${safe_id(value)}`}
				name={`${state.id}_${safe_id(value)}`}
				style={{
					// https://www.a11yproject.com/posts/how-to-hide-content/
					contain: "strict",
					clipPath: "inset(50%)",
					width: 0,
					height: 0,
					pointerEvents: "none",
				}}
				onChange={(e) => {
					const el = e.currentTarget.closest<HTMLElement>("[popover]");
					setTimeout(() => el?.hidePopover(), 0);
					state.onChange?.(value);
				}}
			/>
			<label
				htmlFor={`${state.id}_${safe_id(value)}`}
				className={`${styles["select-option"]} \
					${disabled ? styles.disabled : ""} \
					${value === state.value ? styles.selected : ""}`}
				title={value}
				style={style}
			>
				{nodes}
			</label>
		</>
	);
}

type SelectChild =
	| React.ReactElement<OptionProps, typeof Option>
	| React.FunctionComponentElement<OptionProps>;
// | React.ReactElement<React.HTMLProps<HTMLOptGroupElement>, "optgroup">;

type MutableRef<T> = React.MutableRefObject<T> | ((value: T) => void);

enum DeltaMode {
	DOM_DELTA_PIXEL = 0x00,
	DOM_DELTA_LINE = 0x01,
	DOM_DELTA_PAGE = 0x02,
}

function SelectPopover({
	id,
	children,
	beforeContent,
	updatePosition,
	onToggleOpen,
	display = "vertical",
}: {
	id: string;
	children?: React.ReactNode;
	beforeContent?: React.ReactNode;
	updatePosition?: MutableRef<() => void>;
	onToggleOpen?: (open: boolean) => void;
	display?:
		| "vertical"
		| "horizontal"
		| {
				type: "grid";
				width: number;
		  };
}) {
	const state = React.useContext(SelectState);
	const ref = React.useRef<HTMLDivElement | null>(null);

	const [rect, setRect] = React.useState<DOMRect | null>(null);
	const updatePos = React.useCallback(() => {
		if (!ref.current?.parentElement?.matches(":popover-open")) return;
		setRect(
			ref.current
				.closest(`.${styles["select-button"]}`)
				?.getBoundingClientRect() ?? null,
		);
	}, []);

	const [winWidth, winHeight] = React.useContext(WindowSize);

	React.useEffect(() => {
		if (typeof updatePosition === "function") return updatePosition(updatePos);
		if (updatePosition) updatePosition.current = updatePos;
	}, [updatePosition, updatePos]);

	const style = React.useMemo(() => {
		const style: React.CSSProperties = {};
		if (rect) {
			style.minWidth = rect.width;
			// Horizontal positioning
			if (rect.x + rect.width / 2 > winWidth / 2) {
				style.right = winWidth - rect.right;
				style.textAlign = "right";
			} else {
				style.left = rect.left;
				style.textAlign = "left";
			}
			if (rect.y + rect.height / 2 > winHeight / 2) {
				style.maxHeight = rect.top - 10;
				style.bottom = winHeight - rect.top;
			} else {
				style.maxHeight = winHeight - rect.bottom - 10;
				style.top = rect.bottom;
			}
		}
		return style;
	}, [winWidth, winHeight, rect]);

	const focusPrev = (count = 1) => {
		let i = count;
		let node = (document.activeElement as HTMLInputElement | null)
			?.previousElementSibling;
		while (node) {
			if (node.matches('input[type="radio"]:not(:disabled)') && !--i) {
				(node as HTMLInputElement).focus();
				node.nextElementSibling?.scrollIntoView({ block: "nearest" });
				break;
			}
			node = node.previousElementSibling;
		}
		if (!node) {
			const node =
				ref.current?.querySelector<HTMLInputElement>(
					'input[type="radio"]:not(:disabled):last-of-type',
				) ?? null;
			node?.focus();
			node?.nextElementSibling?.scrollIntoView({ block: "nearest" });
		}
	};

	const focusNext = (count = 1) => {
		let i = count;
		let node = (document.activeElement as HTMLInputElement | null)
			?.nextElementSibling;
		while (node) {
			if (node.matches('input[type="radio"]:not(:disabled)') && !--i) {
				(node as HTMLInputElement).focus();
				node.nextElementSibling?.scrollIntoView({ block: "nearest" });
				break;
			}
			node = node.nextElementSibling;
		}
		if (!node) {
			const node =
				ref.current?.querySelector<HTMLInputElement>(
					'input[type="radio"]:not(:disabled)',
				) ?? null;
			node?.focus();
			node?.nextElementSibling?.scrollIntoView({ block: "nearest" });
		}
	};

	const activeEl = React.useContext(ActiveElement);
	React.useEffect(() => {
		if (
			!ref.current?.closest(`.${styles["select-button"]}`)?.contains(activeEl)
		)
			ref.current?.closest<HTMLElement>("[popover]")?.hidePopover();
	}, [activeEl]);

	return (
		<div
			id={id}
			popover="auto"
			className={`${styles["popout-container"]} ${HANDLES_CHARS}`}
			style={style}
			ref={(el) => {
				if (!el) return;
				const observer = new IntersectionObserver((es) => {
					for (const evt of es) {
						if (!evt.isIntersecting)
							ref.current?.closest<HTMLElement>("[popover]")?.hidePopover();
					}
				});
				observer.observe(el?.closest(`.${styles["select-button"]}`) ?? el);
			}}
			onToggle={(e) => {
				const open = e.currentTarget.matches(":popover-open");
				onToggleOpen?.(open);
				state.setSearchingValue("");
				ref.current?.scrollTo({ top: 0 });
				updatePos();
				if (open) {
					const root = e.currentTarget;
					setTimeout(() => {
						let el = document.getElementById(
							`${state.id}_${safe_id(state.value ?? "")}`,
						);
						if (!el || el.hasAttribute("disabled"))
							el = root.querySelector<HTMLInputElement>("input:not(:disabled)");
						el?.focus();
					}, 0);
				}
			}}
			onKeyDown={(e) => {
				e.stopPropagation();
				switch (e.key) {
					case "ArrowDown":
					case "ArrowRight": {
						e.preventDefault();
						focusNext(
							e.key === "ArrowDown" &&
								typeof display === "object" &&
								display.type === "grid"
								? display.width
								: 1,
						);
						break;
					}
					case "ArrowUp":
					case "ArrowLeft": {
						e.preventDefault();
						focusPrev(
							e.key === "ArrowUp" &&
								typeof display === "object" &&
								display.type === "grid"
								? display.width
								: 1,
						);
						break;
					}
					case "Enter":
						(e.target as HTMLInputElement | null)?.click();
						break;
					case " ":
						// use defauly behaviour - either input a space or select a radio
						// depending on context
						break;
					default:
						state.searchField?.current?.focus();
				}
			}}
		>
			{beforeContent}
			<div
				className={styles["popout-scroll-container"]}
				style={
					typeof display === "object" && display.type === "grid"
						? { gridTemplateColumns: `repeat(${display.width * 2}, auto)` }
						: {}
				}
				ref={ref}
				onWheel={(e) => {
					const el = ref.current;
					if (!el || el.scrollHeight > el.clientHeight) return;
					let dist = e.deltaY ?? e.detail;
					switch (e.deltaMode) {
						case DeltaMode.DOM_DELTA_PIXEL:
							dist = Math.sign(dist);
							break;
						case DeltaMode.DOM_DELTA_PAGE:
							dist *=
								(el.clientHeight ?? 100) /
								(el.lastElementChild?.clientHeight ?? 26);
							dist = Math.round(dist);
					}
					if (dist < 0) {
						focusPrev(-dist);
					} else {
						focusNext(dist);
					}
				}}
			>
				{children}
			</div>
		</div>
	);
}

function setEquals<T>(a: T[], b: T[]) {
	return !new Set(a).symmetricDifference(new Set(b)).size;
}

export type SelectProps = {
	value?: string;
	onChange?: (value: string) => void;
	onToggleOpen?: (open: boolean) => void;
	children?: SelectChild | SelectChild[];
	updatePosition?: MutableRef<() => void>;
	display?:
		| "vertical"
		| "horizontal"
		| {
				type: "grid";
				width: number;
		  };
	style?: React.CSSProperties;
	className?: string;
	title?: string;
	disabled?: boolean;
};

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
	function Select(
		{
			value,
			onChange,
			children,
			updatePosition,
			className,
			onToggleOpen,
			display = "vertical",
			...props
		},
		ref,
	) {
		const id = React.useId();
		const [searchingValue, setSearchingValue] = React.useState("");
		// biome-ignore lint/correctness/useExhaustiveDependencies: very intentional
		const map = React.useMemo<React.ContextType<typeof SelectState>["map"]>(
			() => ({}),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[searchingValue],
		);
		const searchField = React.useRef<HTMLInputElement | null>(null);
		// const [open, setOpen] = React.useState(false);

		const childs = React.useMemo(
			() => (Array.isArray(children) ? children : children ? [children] : []),
			[children],
		);

		const { label, style } = React.useMemo<Partial<OptionProps>>(
			() => childs.find((child) => child.props.value === value)?.props ?? {},
			[childs, value],
		);

		const options = React.useMemo(
			() =>
				childs
					.map((el) => {
						if (!el) return;
						const props = el.props;
						const oldProps = map[props.value]?.props;
						if (
							oldProps &&
							oldProps.label === props.label &&
							oldProps.value === props.value &&
							(oldProps.valueAliases === props.valueAliases ||
								setEquals(
									oldProps.valueAliases ?? [],
									props.valueAliases ?? [],
								))
						)
							return [el, map[props.value].matches.score] as const;
						const labelString =
							typeof props.label === "string"
								? props.label
								: Array.isArray(props.label)
									? props.label.find((x) => typeof x === "string")
									: undefined;
						const matches = match(searchingValue, [
							...(labelString ? [labelString] : []),
							props.value,
							...(props.valueAliases ?? []),
						]);
						if (!matches) return;
						if (matches.in === (props.label ?? props.value)) matches.score++;
						map[props.value] = { matches, props };
						return [el, matches.score] as const;
					})
					.filter((x) => !!x)
					.sort((a, b) => b[1] - a[1])
					.map((x) => x[0]),
			[childs, searchingValue, map],
		);

		return (
			<SelectState.Provider
				value={{
					id,
					value,
					onChange,
					searchingValue,
					setSearchingValue,
					map,
					searchField,
				}}
			>
				<button
					type="button"
					popoverTarget={id}
					popoverTargetAction="toggle"
					style={props.style}
					className={`${styles["select-button"]} ${
						display === "horizontal"
							? styles.horizontal
							: display === "vertical"
								? ""
								: styles.grid
					} ${className}`}
					ref={ref}
					{...props}
				>
					<span style={style} className={styles["select-value-container"]}>
						{label ?? value ?? "unset"}
					</span>
					<SelectPopover
						id={id}
						updatePosition={updatePosition}
						display={display}
						onToggleOpen={onToggleOpen}
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
					>
						{options.length ? (
							options
						) : (
							<span className={styles["no-results"]}>
								No results matching &lsquo;{searchingValue}&rsquo;
							</span>
						)}
					</SelectPopover>
				</button>
			</SelectState.Provider>
		);
	},
);
