import React, { useEffect } from "react";
import styles from "@/app/styles/select.module.css";

type OptionProps = {
	label?: string;
	value: string;
	valueAliases?: string[];
	disabled?: boolean;
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

export function Option({ label, value, disabled }: OptionProps) {
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
				style={{ width: 0, height: 0 }}
				onChange={(e) => {
					const el = e.currentTarget.parentElement;
					setTimeout(() => el?.hidePopover(), 0);
					state.onChange?.(value);
				}}
			/>
			<label
				htmlFor={`${state.id}_${value}`}
				className={`${styles["select-option"]} ${disabled ? styles.disabled : ""}`}
			>
				{nodes}
			</label>
		</>
	);
}

type SelectChild = React.ReactElement<OptionProps, typeof Option>;
// | React.ReactElement<React.HTMLProps<HTMLOptGroupElement>, "optgroup">;

function SelectPopover(props: {
	id: string;
	children?: React.ReactNode;
	beforeContent?: React.ReactNode;
}) {
	const state = React.useContext(SelectState);
	const ref = React.useRef<HTMLDivElement | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: we want to focus first element in search
	useEffect(() => {
		(
			ref.current?.querySelector<HTMLInputElement>('input[type="radio"]') ??
			state.searchField?.current
		)?.focus();
	}, [state.searchingValue]);
	return (
		<div
			id={props.id}
			popover="auto"
			className={styles["popout-container"]}
			onToggle={(e) => {
				state.setSearchingValue("");
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
						let node = (e.target as HTMLInputElement)?.nextElementSibling;
						while (node) {
							if (node.matches('input[type="radio"]:not([disabled])')) {
								(node as HTMLInputElement).focus();
								node.scrollIntoView({ block: "nearest" });
								break;
							}
							node = node.nextElementSibling;
						}
						break;
					}
					case "ArrowUp":
					case "ArrowLeft": {
						e.preventDefault();
						let node = (e.target as HTMLInputElement)?.previousElementSibling;
						while (node) {
							if (node.matches('input[type="radio"]:not([disabled])')) {
								(node as HTMLInputElement).focus();
								node.scrollIntoView({ block: "nearest" });
								break;
							}
							node = node.previousElementSibling;
						}
						break;
					}
					default:
						state.searchField?.current?.focus();
				}
			}}
		>
			{props.beforeContent}
			<div className={styles["popout-scroll-container"]} ref={ref}>
				{props.children}
			</div>
		</div>
	);
}

function setEquals<T>(a: T[], b: T[]) {
	return !new Set(a).symmetricDifference(new Set(b)).size;
}

export function Select(props: {
	value?: string;
	onChange?: (value: string) => void;
	children?: SelectChild | SelectChild[];
	style?: React.CSSProperties;
	className?: string;
	alignRight?: boolean;
}) {
	const id = React.useId();
	const [searchingValue, setSearchingValue] = React.useState("");
	// biome-ignore lint/correctness/useExhaustiveDependencies: very intentional
	const map = React.useMemo<React.ContextType<typeof SelectState>["map"]>(
		() => ({}),
		[searchingValue],
	);
	const searchField = React.useRef<HTMLInputElement | null>(null);

	const options = React.useMemo(
		() =>
			(Array.isArray(props.children)
				? props.children
				: props.children
					? [props.children]
					: []
			)
				.map((el) => {
					if (!el) return;
					const props = el.props;
					const oldProps = map[props.value]?.props;
					if (
						oldProps &&
						oldProps.label === props.label &&
						oldProps.value === props.value &&
						(oldProps.valueAliases === props.valueAliases ||
							setEquals(oldProps.valueAliases ?? [], props.valueAliases ?? []))
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
		[props.children, searchingValue, map],
	);

	return (
		<SelectState.Provider
			value={{
				id,
				value: props.value,
				onChange: props.onChange,
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
				className={`${styles["select-button"]} ${props.alignRight ? styles.right : ""} ${props.className}`}
			>
				{props.value ?? "unset"}
				<SelectPopover
					id={id}
					beforeContent={
						<input
							type="search"
							ref={searchField}
							value={searchingValue}
							onChange={(e) => setSearchingValue(e.currentTarget.value)}
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
					{options.length ? options : `No results matching '${searchingValue}'`}
				</SelectPopover>
			</button>
		</SelectState.Provider>
	);
}
