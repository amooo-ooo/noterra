// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function unreachable(_value: never): never {
	throw "Unreachable";
}

export function anyPass<T>(arr: T[], predicate: (value: T) => boolean) {
	for (const el of arr) {
		if (predicate(el)) return true;
	}
	return false;
}

export type ItemOf<T> = T extends (infer I)[] ? I : never;
