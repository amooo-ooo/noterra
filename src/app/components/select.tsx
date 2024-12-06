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
				style={{ width: 0 }}
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
				{label ?? value}
			</label>
		</>
	);
}

type SelectChild = React.ReactElement<OptionProps, typeof Option>;
// | React.ReactElement<React.HTMLProps<HTMLOptGroupElement>, "optgroup">;

function SelectPopover(props: {
	id: string;
	children?: SelectChild | SelectChild[];
}) {
	const state = React.useContext(SelectState);
	return (
		<div
			id={props.id}
			popover="auto"
			className={styles["popout-container"]}
			onToggle={(e) =>
				e.currentTarget
					.querySelector<HTMLInputElement>(`[id="${state.id}_${state.value}"]`)
					?.focus()
			}
			onKeyDownCapture={(e) => {
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
				}
			}}
		>
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
	return (
		<SelectState.Provider
			value={{
				id,
				value: props.value,
				onChange: props.onChange,
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
				<SelectPopover id={id}>{props.children}</SelectPopover>
			</button>
		</SelectState.Provider>
	);
}
