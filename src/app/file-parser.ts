import JSZip from "jszip";
// import { type File as FileData, LocalFile } from "./editor-files";
import { themable } from "./img-themable";
// import { IMAGE_THEMATIC_CLASS } from "@/app/editor-extensions/blob-imgs";

async function readText(file: File) {
	const reader = new FileReader();
	return new Promise<string>((res) => {
		reader.addEventListener("load", () => res(reader.result as string));
		reader.readAsText(file);
	});
}

function parseCSS(css: string) {
	const node = document.createElement("style");
	document.head.append(node);
	node.disabled = true;
	node.textContent = css;
	const styles = [...document.styleSheets].find((x) => x.ownerNode === node);
	node.remove();
	return styles;
}

async function handleEPub(id: FileData["id"], name: string, zip: JSZip) {
	const result = new LocalFile(id, name);
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
