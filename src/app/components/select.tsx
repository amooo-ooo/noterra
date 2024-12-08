import React from "react";
import styles from "@/app/styles/select.module.css";
import { WindowSize } from "./global-listeners";

type OptionProps = {
	label?: string;
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
			arr
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
				id={`${state.id}_${value}`}
				name={`${state.id}_${value}`}
				style={{
					// https://www.a11yproject.com/posts/how-to-hide-content/
					contain: "strict",
					clipPath: "inset(50%)",
					position: "absolute",
					width: 1,
					height: 1,
				}}
				onChange={(e) => {
					const el = e.currentTarget.closest<HTMLElement>("[popover]");
					setTimeout(() => el?.hidePopover(), 0);
					state.onChange?.(value);
				}}
			/>
			<label
				htmlFor={`${state.id}_${value}`}
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

type SelectChild = React.ReactElement<OptionProps, typeof Option>;
// | React.ReactElement<React.HTMLProps<HTMLOptGroupElement>, "optgroup">;

type MutableRef<T> = React.MutableRefObject<T> | ((value: T) => void);

function SelectPopover({
	id,
	children,
	beforeContent,
	updatePosition,
}: {
	id: string;
	children?: React.ReactNode;
	beforeContent?: React.ReactNode;
	updatePosition?: MutableRef<() => void>;
}) {
	const state = React.useContext(SelectState);
	const ref = React.useRef<HTMLDivElement | null>(null);

	const [rect, setRect] = React.useState<DOMRect | null>(null);
	const updatePos = React.useCallback(
		() => {
			if (!(ref.current?.parentElement?.matches(':popover-open'))) return;
			setRect(ref.current.closest(`.${styles['select-button']}`)
				?.getBoundingClientRect() ?? null);
		},
		[],
	);

	const [winWidth, winHeight] = React.useContext(WindowSize);

	React.useEffect(() => {
		if (typeof updatePosition === "function") return updatePosition(updatePos);
		if (updatePosition) updatePosition.current = updatePos;
	}, [updatePosition, updatePos]);

	const style = React.useMemo(() => {
		const style: React.CSSProperties = {};
		if (rect) {
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

	return (
		<div
			id={id}
			popover="auto"
			className={styles["popout-container"]}
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
			onBlurCapture={(e) => {
				const el = e.currentTarget;
				setTimeout(() => {
					if (!el.parentElement?.contains(document.activeElement))
						el.hidePopover();
				}, 0);
			}}
			onToggle={(e) => {
				state.setSearchingValue("");
				ref.current?.scrollTo({ top: 0 });
				updatePos();
				e.currentTarget
					.querySelector<HTMLInputElement>(`[id="${state.id}_${state.value}"]`)
					?.focus();
			}}
			onKeyDown={(e) => {
				e.stopPropagation();
				switch (e.key) {
					case "ArrowDown":
					case "ArrowRight": {
						e.preventDefault();
						const id = (e.target as HTMLInputElement).id;
						const node =
							ref.current?.querySelector<HTMLInputElement>(
								`[id="${id}"] ~ input[type="radio"]`,
							) ??
							ref.current?.querySelector<HTMLInputElement>(
								'input[type="radio"]',
							);
						node?.focus();
						node?.nextElementSibling?.scrollIntoView({ block: "nearest" });
						break;
					}
					case "ArrowUp":
					case "ArrowLeft": {
						e.preventDefault();
						let node = (e.target as HTMLInputElement)?.previousElementSibling;
						while (node) {
							if (node.matches('input[type="radio"]:not([disabled])')) {
								(node as HTMLInputElement).focus();
								node.nextElementSibling?.scrollIntoView({ block: "nearest" });
								break;
							}
							node = node.previousElementSibling;
						}
						if (!node) {
							const node =
								ref.current?.querySelector<HTMLInputElement>(
									'input[type="radio"]:last-of-type',
								) ?? null;
							node?.focus();
							node?.nextElementSibling?.scrollIntoView({ block: "nearest" });
						}
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
			<div className={styles["popout-scroll-container"]} ref={ref}>
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
	children?: SelectChild | SelectChild[];
	updatePosition?: MutableRef<() => void>;
	style?: React.CSSProperties;
	className?: string;
	title?: string;
};

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
	function Select({
		value,
		onChange,
		children,
		updatePosition,
		className,
		...props
	}, ref) {
		const id = React.useId();
		const [searchingValue, setSearchingValue] = React.useState("");
		// biome-ignore lint/correctness/useExhaustiveDependencies: very intentional
		const map = React.useMemo<React.ContextType<typeof SelectState>["map"]>(
			() => ({}),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[searchingValue],
		);
		const searchField = React.useRef<HTMLInputElement | null>(null);

		const childs = React.useMemo(() => (Array.isArray(children)
			? children
			: children
				? [children]
				: []
		), [children]);

		const label = React.useMemo(() =>
			childs.find(child => child.props.value === value)?.props.label,
			[childs, value]);

		const options = React.useMemo(
			() =>
				childs.map((el) => {
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
						const matches = match(searchingValue, [
							props.label ?? props.value,
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
					className={`${styles["select-button"]} ${className}`}
					ref={ref}
					{...props}
				>
					<p>{label ?? value ?? "unset"}</p>
					<SelectPopover
						id={id}
						updatePosition={updatePosition}
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
