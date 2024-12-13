import JSZip from "jszip";

async function readText(file: File) {
	const reader = new FileReader();
	return new Promise<string>((res) => {
		reader.addEventListener("load", () => res(reader.result as string));
		reader.readAsText(file);
	});
}

function raise(message: string): never {
	throw new Error(message);
}

function dir(path: string) {
	return path.replace(/^(.*)[/\\][^/\\]*$/, "$1");
}

async function handleEPub(zip: JSZip) {
	const parser = new DOMParser();
	const metaInfF =
		zip.file("META-INF/container.xml") ?? raise("Could not find META-INF");
	const metaInf = parser.parseFromString(
		await metaInfF.async("string"),
		"application/xml",
	);
	const rootfiles = await Promise.all(
		[...metaInf.querySelectorAll("rootfile")].map(async (el) => {
			const path =
				el.getAttribute("full-path") ?? raise("Rootfile without path");
			const content = await (
				zip.file(path) ?? raise(`Rootfile '${path}' not found`)
			).async("string");
			return {
				path,
				type: el.getAttribute("media-type"),
				dom: parser.parseFromString(content, "application/xml"),
			};
		}),
	);
	const items = Object.fromEntries(
		rootfiles.flatMap((file) =>
			[...file.dom.querySelectorAll("item")].map(
				(item) =>
					[
						item.getAttribute("id") as string,
						{
							id: item.getAttribute("id") as string,
							href: `${dir(file.path)}/${item.getAttribute("href") as string}`,
							type: item.getAttribute("media-type") as string,
							el: item,
						},
					] as const,
			),
		),
	);
	const spine = await Promise.all(
		rootfiles.flatMap((file) =>
			[...file.dom.querySelectorAll("spine > itemref")].map(async (item) => {
				const id = item.getAttribute("idref") as string;
				const file =
					zip.file(items[id].href) ?? raise(`Item '${id}' not found`);
				const dom = parser.parseFromString(
					await file.async("string"),
					"application/xhtml+xml",
				);
				for (const img of dom.querySelectorAll("img")) {
					const file =
						zip.file(`${dir(items[id].href)}/${img.getAttribute("src")}`) ??
						raise(`Image '${img.getAttribute("src")}' not found`);
					img.src = URL.createObjectURL(await file.async("blob"));
				}
				return dom;
			}),
		),
	);
	return spine
		.map((doc) => doc.querySelector("section")?.outerHTML ?? "")
		.join("");
}

export async function handleFile(file: File): Promise<string> {
	switch (file.type) {
		case "application/epub+zip": {
			const zip = await JSZip.loadAsync(file);
			return handleEPub(zip);
		}
		case "text/html":
			return readText(file);
		default: {
			const sanitizer = document.createElement("span");
			sanitizer.textContent = await readText(file);
			return sanitizer.innerHTML;
		}
	}
}
