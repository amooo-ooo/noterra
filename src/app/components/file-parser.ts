import JSZip from "jszip";
import { type File as FileData, LocalFile } from "./editor-files";

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

async function handleEPub(id: FileData["id"], name: string, zip: JSZip) {
	const result = new LocalFile(id, name);
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
					const path = `${dir(items[id].href)}/${img.getAttribute("src")}`;
					const file = zip.file(path) ?? raise(`Image at '${path}' not found`);
					result.attachments[path] = await file.async("blob");
					img.removeAttribute("src");
					img.setAttribute("data-blob-src", path);
					img.alt ||= path;
				}
				return dom;
			}),
		),
	);
	result.content = spine
		.map((doc) => doc.querySelector("section")?.outerHTML ?? "")
		.join("");
	return result;
}

export async function handleFile(
	id: FileData["id"],
	file: File,
): Promise<LocalFile> {
	switch (file.type) {
		case "application/epub+zip": {
			const zip = await JSZip.loadAsync(file);
			return handleEPub(id, file.name, zip);
		}
		case "text/html":
			return new LocalFile(id, file.name, await readText(file));
		default: {
			const sanitizer = document.createElement("span");
			sanitizer.textContent = await readText(file);
			return new LocalFile(id, file.name, sanitizer.innerHTML);
		}
	}
}
