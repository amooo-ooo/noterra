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

function safeTraversal(path: string) {
	return path
		.replace(/([^\\/]*[\\/])?\.\.[\\/]/g, "")
		.replace(/[\\/]\.([\\/])/g, "$1");
}

function joinPath(left: string, right: string) {
	if (right.startsWith("/") || right.startsWith("\\"))
		return safeTraversal(right);
	return safeTraversal(`${left.replace(/[\\/]$/, "")}/${right}`);
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
	const parser = new DOMParser();
	const metaInfF =
		zip.file("META-INF/container.xml") ?? raise("Could not find META-INF");
	const metaInf = parser.parseFromString(
		await metaInfF.async("string"),
		"application/xml",
	);
	const rootfiles = await Promise.all(
		[...metaInf.querySelectorAll("rootfile")].map(async (el) => {
			const path = decodeURIComponent(
				el.getAttribute("full-path") ?? raise("Rootfile without path"),
			);
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
	const titles = rootfiles
		.flatMap((file) => [...file.dom.getElementsByTagName("dc:title")])
		.map((el) => el.textContent);
	const items = Object.fromEntries(
		rootfiles.flatMap((file) =>
			[...file.dom.querySelectorAll("item")].map(
				(item) =>
					[
						item.getAttribute("id") as string,
						{
							id: item.getAttribute("id") as string,
							href: joinPath(
								dir(file.path),
								decodeURIComponent(item.getAttribute("href") ?? ""),
							),
							type: item.getAttribute("media-type") as string,
							el: item,
							rootPath: file.path,
						},
					] as const,
			),
		),
	);
	function resolvePath(base: string, path?: string | null) {
		const relPath = decodeURIComponent(path ?? "");
		// TODO: standard way to do this????
		for (const title of titles) {
			if (relPath.startsWith(`${title}_files`)) {
				return items[relPath.replace(/.*[\\/]([^\\/]*)$/, "$1")].href;
			}
		}
		return joinPath(base, path ?? "");
	}
	const cssCache: Record<string, CSSStyleSheet | undefined> = {};
	const spine = await Promise.all(
		rootfiles.flatMap((file) =>
			[...file.dom.querySelectorAll("spine > itemref")].map(async (item) => {
				const id = item.getAttribute("idref") as string;
				const file =
					zip.file(items[id].href) ??
					raise(`Item '${id}' at '${items[id].href}' not found`);
				const dom = parser.parseFromString(
					await file.async("string"),
					"application/xhtml+xml",
				);
				// Local image files
				for (const img of dom.querySelectorAll("img")) {
					const path = resolvePath(
						dir(items[id].href),
						decodeURIComponent(img.getAttribute("src") ?? ""),
					);
					const file = zip.file(path) ?? raise(`Image at '${path}' not found`);
					result.attachments[path] = await file.async("blob");
					img.removeAttribute("src");
					img.setAttribute("data-blob-src", path);
					img.alt ||= path;
				}
				// for (const unsupported of dom.querySelectorAll("ruby, rp, rt")) {
				// 	if (unsupported.hasAttribute("style")) {
				// 		const nw = dom.createElement("span");
				// 		nw.setAttribute("style", unsupported.getAttribute("style") ?? "");
				// 		nw.append(...unsupported.childNodes);
				// 		unsupported.replaceWith(nw);
				// 		continue;
				// 	}
				// 	unsupported.replaceWith(...unsupported.childNodes);
				// }
				// Custom EPUB CSS
				for (const css of dom.querySelectorAll<
					HTMLLinkElement | HTMLStyleElement
				>('link[rel="stylesheet" i], style')) {
					let ruleset: CSSStyleSheet | undefined;
					if (css.tagName.toUpperCase() === "LINK") {
						const path = resolvePath(
							dir(items[id].href),
							decodeURIComponent(css.getAttribute("href") ?? ""),
						);
						ruleset = cssCache[path] ??= await (async () => {
							const file = zip.file(path);
							if (!file) {
								console.warn(`CSS at '${path}' not found`);
								return;
							}
							return parseCSS(await file.async("text"));
						})();
					} else {
						const cssStr = css.textContent;
						if (!cssStr) continue;
						ruleset = parseCSS(cssStr);
					}
					if (!ruleset) continue;
					for (const rule of ruleset?.cssRules ?? [])
						if (rule instanceof CSSStyleRule) {
							const styles = rule.style.cssText;
							const els = dom.querySelectorAll(rule.selectorText);
							for (const el of els) {
								const oldStyle =
									el.getAttribute("styles")?.replace(/;\s*$/, "") ?? "";
								el.setAttribute("style", `${oldStyle};${styles}`);
							}
						}
				}
				// Cover images
				if (
					dom.body.textContent?.trim() === "" &&
					dom.body.querySelector("img")
				) {
					dom.body.replaceChildren(...dom.body.querySelectorAll("img"));
				}
				return dom;
			}),
		),
	);
	result.content = spine
		.map((doc) => `<section>${doc.body.innerHTML}</section>`)
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
