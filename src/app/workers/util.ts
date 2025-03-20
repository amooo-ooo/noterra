// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function unreachable(_value: never): never {
	throw "Unreachable";
}

export function raise(msg: string): never {
	throw new Error(msg);
}
