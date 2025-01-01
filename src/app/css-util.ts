export const SIDES = ["top", "right", "bottom", "left"] as const;
export type Sides = "top" | "left" | "bottom" | "right";
export type SidewiseProps<T> = Record<Sides, T>;
export type SizeUnits = "em" | "px" | "pt" | "rem" | "%";
type RawSize = `${number}${SizeUnits}`;
type Arith<T extends string | number> = `${T}` | `${T} + ${T}`;
export type Size = number | `${number}` | RawSize;
export type CalcSize = Size | `calc(${Arith<Arith<RawSize>>})`;
export type SidedSizeProps =
	| Partial<SidewiseProps<CalcSize>>
	| CalcSize
	| `${Size} ${Size}`
	| `${Size} ${Size} ${Size} ${Size}`
	| [CalcSize]
	| [Size, Size]
	| [Size, Size, Size, Size];

export type VerticalAlign = 'baseline' | 'sub' | 'super' | 'text-top' | 'text-bottom' | 'middle' | 'top' | 'bottom' | Size;

export function pxIfy(size: number | string) {
	return typeof size === 'number' || /^\d+\.?$|^\d*\.\d+$/.test(size) ? `${size}px` : size;
}

// type Seperator = "," | ", ";
// type AngleUnits = "deg" | "rad" | "turn";
// type Angle = `${number}${AngleUnits}`;
// type NumOrPercent = `${number}${"" | "%"}`;
// export type Color =
// 	| `#${string}`
// 	| `rgb(${number}${Seperator}${number}${Seperator}${number})`
// 	| `rgb(${number}%${Seperator}${number}%${Seperator}${number}%)`
// 	| `rgb(${NumOrPercent} ${NumOrPercent} ${NumOrPercent})`
// 	| `${"rgb" | "rgba"}(${number}${Seperator}${number}${Seperator}${number}${Seperator}${NumOrPercent})`
// 	| `${"rgb" | "rgba"}(${number}%${Seperator}${number}%${Seperator}${number}%${Seperator}${NumOrPercent})`
// 	| `${"rgb" | "rgba"}(${NumOrPercent} ${NumOrPercent} ${NumOrPercent} / ${NumOrPercent | "none"})`
// 	| `hsl(${Angle}${Seperator}${number}${Seperator}${number})`;

export function add(a: Size, b: Size): CalcSize {
	const aNumber = typeof a === "number";
	const bNumber = typeof b === "number";
	if (
		(aNumber || /[^a-zA-Z%]$/.test(a)) &&
		(bNumber || /[^a-zA-Z%]$/.test(b))
	) {
		return (
			(aNumber ? a : Number.parseFloat(a)) +
			(bNumber ? b : Number.parseFloat(b))
		);
	}
	const aClean = aNumber || !/[^a-zA-Z%]$/.test(a) ? `${a}px` : a;
	const bClean = bNumber || !/[^a-zA-Z%]$/.test(b) ? `${b}px` : b;
	const aM = aClean.match(/^(.*?)([a-zA-Z%]*)$/);
	const bM = bClean.match(/^(.*?)([a-zA-Z%]*)$/);
	if (aM && bM && aM.at(-1) === bM.at(-1))
		return `${Number.parseFloat(aM.at(1) ?? "0") + Number.parseFloat(bM.at(1) ?? "0")
			}${aM?.at(-1) as SizeUnits}`;
	return `calc(${aClean as RawSize} + ${bClean as RawSize})`;
}

export function parseSidedSizes(
	value: SidedSizeProps,
): SidewiseProps<CalcSize> {
	if (typeof value === "object" && !Array.isArray(value))
		return { top: 0, left: 0, bottom: 0, right: 0, ...value };
	const sides = Array.isArray(value)
		? value
		: (`${value}`.split(/\s(?![^()]*\))/g) as Size[]);
	return Object.fromEntries<CalcSize>(
		SIDES.map((side, idx) => [side, sides[idx % sides.length]]),
	) as SidewiseProps<CalcSize>;
}
