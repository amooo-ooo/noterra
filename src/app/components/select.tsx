import React from "react";
import styles from "@/app/styles/select.module.css";

const SelectState = React.createContext<{
	id: string;
	value?: string;
	onChange?: (value: string) => void;
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
}>(null!);

type OptionProps = {
	label?: string;
	value: string;
	disabled?: boolean;
}; // TODO: custom selects (using <input type="radio" /> and <label>s)
export function Option({ label, value, disabled }: OptionProps) {
	const state = React.useContext(SelectState);
	return (
		<>
			<input
				type="radio"
				checked={state.value === value}
				disabled={disabled}
				id={`${state.id}_${value}`}
				name={`${state.id}_${value}`}
				style={{ display: "none" }}
				onChange={(e) => state.onChange?.(value)}
			/>
			<label
				htmlFor={`${state.id}_${value}`}
				className={styles["select-option"]}
			>
				{label ?? value}
			</label>
		</>
	);
	// <option disabled={disabled} value={value}>
	// 	{label ?? value}
	// </option>
}

type SelectChild = React.ReactElement<OptionProps, typeof Option>;
// | React.ReactElement<React.HTMLProps<HTMLOptGroupElement>, "optgroup">;

function SelectPopover(props: {
	id: string;
	children?: SelectChild | SelectChild[];
}) {
	return (
		<div id={props.id} popover="auto" className={styles["popout-container"]}>
			{props.children}
		</div>
	);
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
	// const children = props.children
	// 	? Array.isArray(props.children)
	// 		? props.children
	// 		: [props.children]
	// 	: [];
	console.log("render");
	return (
		// <select
		// 	value={props.value}
		// 	onChange={(e) => props.onChange?.(e.target.value)}
		// 	style={props.style}
		// 	className={props.className}
		// >
		// 	{props.children}
		// </select>
		<SelectState.Provider
			value={{ id, value: props.value, onChange: props.onChange }}
		>
			<button
				type="button"
				popoverTarget={id}
				popoverTargetAction="toggle"
				className={`${styles["select-button"]} ${props.alignRight ? styles.right : ""} ${props.className}`}
			>
				{props.value ?? "unset"}
				<SelectPopover id={id}>{props.children}</SelectPopover>
			</button>
		</SelectState.Provider>
	);
}
