import type React from "react";

type OptionProps = {
	label?: string;
	value: string;
	disabled?: boolean;
}; // TODO: custom selects (using <input type="radio" /> and <label>s)
export function Option({ label, value, disabled }: OptionProps) {
	return (
		<option disabled={disabled} value={value}>
			{label ?? value}
		</option>
	);
}

type SelectChild = React.ReactElement<OptionProps, typeof Option>;
// | React.ReactElement<React.HTMLProps<HTMLOptGroupElement>, "optgroup">;

export function Select(props: {
	value?: string;
	onChange?: (value: string) => void;
	children?: SelectChild | SelectChild[];
	style?: React.CSSProperties;
	className?: string;
}) {
	const children = props.children
		? Array.isArray(props.children)
			? props.children
			: [props.children]
		: [];
	return (
		<select
			value={props.value}
			onChange={(e) => props.onChange?.(e.target.value)}
			style={props.style}
			className={props.className}
		>
			{children}
		</select>
	);
}
