import "via.js/controller";
import JSZip from "jszip";
import { themable } from "./img-themable";
import type { RecieverGlobal } from "@/app/file-parser";

declare const via: RecieverGlobal;
declare const self: WorkerGlobalScope & typeof globalThis;

function raise(message: string): never {
	throw new Error(message);
}

function dir(path: string) {
	return path.replace(/^(.*)([/\\]|^)[^/\\]*$/, "$1");
}

function safeTraversal(path: string) {
	return path
		.replace(/([^\\/]*[\\/])?\.\.[\\/]/g, "")
		.replace(/[\\/]\.([\\/])/g, "$1")
		.replace(/^[\\/]/, '');
}

function joinPath(left: string, right: string) {
	if (right.startsWith("/") || right.startsWith("\\"))
		return safeTraversal(right);
	return safeTraversal(`${left.replace(/[\\/]$/, "")}/${right}`);
}

async function map<T, R>(gen: Iterator<T>, f: (val: T) => R) {
	let next = gen.next();
	const result = [];
	while (!await get(next.done)) {
		result.push(f(next.value));
		next = gen.next();
	}
	return result;
}

// async function unwrapNodes<T extends Node>(iter: NodeListOf<T>) {
// 	const gen = iter.values();
// 	let next = gen.next();
// 	cons
// 	while (!await get(next.done)) {
// 		result.push(next.value);
// 		next = gen.next();
// 	}
// }

function* iterArrayLike<T>(arr: ArrayLike<T>, length: number = arr.length) {
	for (let i = 0; i < length; i++) {
		yield arr[i];
	}
}

async function iterRemoteArr<T>(arr: ArrayLike<T>) {
	return iterArrayLike(arr, await get(arr.length));
}

async function handleEPub(data: Blob, IMAGE_THEMATIC_CLASS: string) {
	const zip = await JSZip.loadAsync(data);
	const attachments: Record<string, Blob> = {};
	const parser = new via.DOMParser();
	const metaInfF =
		zip.file("META-INF/container.xml") ?? raise("Could not find META-INF");
	const metaInf = parser.parseFromString(
		await metaInfF.async("string"),
		"application/xml",
	);
	const rootfiles = await Promise.all([
		...await map(metaInf.querySelectorAll("rootfile").values(), async (el) => {
			const path = decodeURIComponent(
				await get(el.getAttribute("full-path")) ?? raise("Rootfile without path"),
			);
			const content = await (
				zip.file(path) ?? raise(`Rootfile '${path}' not found`)
			).async("string");
			return {
				path,
				// type: el.getAttribute("media-type"),
				dom: parser.parseFromString(content, "application/xml"),
			};
		}),
	]);
	const titles = (await Promise.all(
		rootfiles.map(
			async (file) =>
				await Promise.all(
					await map(
						await iterRemoteArr(file.dom.getElementsByTagName("dc:title")),
						async (x) => await get(x.textContent) as string,
					),
				)
		),
	)).flat(1);
	const items = Object.fromEntries(
		(await Promise.all(
			rootfiles.map(async (file) => await Promise.all(
				await map(file.dom.querySelectorAll("item").values(), async (item) => {
					const id = await get(item.getAttribute("id") as string);
					return [
						id,
						{
							id,
							href: joinPath(
								dir(file.path),
								decodeURIComponent(
									(await get(item.getAttribute("href"))) ?? "",
								),
							),
							// type: item.getAttribute("media-type") as string,
							// el: item,
							rootPath: file.path,
						},
					] as const;
				}),
			)),
		)).flat(1),
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
	const imgThematic: Record<string, boolean> = {};
	const spine = (await Promise.all(
		rootfiles.map(async (file) =>
		(await Promise.all(await map(file.dom.querySelectorAll("spine > itemref").values(), async (item) => {
			const id = await get(item.getAttribute("idref")) as string;
			const file =
				zip.file(items[id].href) ??
				raise(`Item '${id}' at '${items[id].href}' not found`);
			const dom = parser.parseFromString(
				await file.async("string"),
				"application/xhtml+xml",
			);
			// TODO: dont like special casing
			for (const img of await iterRemoteArr(dom.querySelectorAll<ChildNode & SVGImageElement>(
				"svg > image:only-child",
			))) {
				const newImg = dom.createElement("img");
				newImg.setAttribute(
					"src",
					await get(img.getAttribute("xlink:href")) ??
					raise(`image '${img.outerHTML}' no src`),
				);
				const styles = await get(img.parentElement?.getAttribute("style")) as string | null;
				if (styles) newImg.setAttribute("style", styles);
				img.parentElement?.replaceWith(newImg);
			}
			// Local image files
			for (const img of await iterRemoteArr(dom.querySelectorAll("img"))) {
				const path = resolvePath(
					dir(items[id].href),
					decodeURIComponent(await get(img.getAttribute("src")) ?? ""),
				);
				if (!attachments[path]) {
					const file =
						zip.file(path) ?? raise(`Image at '${path}' not found`);
					const imgData = await file.async("blob");
					const themedImg = await themable(imgData);
					if (themedImg) {
						attachments[path] = themedImg;
						imgThematic[path] = true;
					} else {
						attachments[path] = imgData;
					}
				}
				if (imgThematic[path]) img.classList.add(IMAGE_THEMATIC_CLASS);
				img.removeAttribute("src");
				img.setAttribute("data-blob-src", path);
				img.alt ||= path;
			}
			// Custom EPUB CSS
			for (const css of await iterRemoteArr(
				dom.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
					'link[rel="stylesheet" i], style',
				),
			)) {
				let ruleset: CSSStyleSheet | undefined;
				if ((await get(css.tagName) as string).toUpperCase() === "LINK") {
					const path = resolvePath(
						dir(items[id].href),
						decodeURIComponent(await get(css.getAttribute("href")) ?? ""),
					);
					ruleset = cssCache[path] ??= (await (async () => {
						const file = zip.file(path);
						if (!file) {
							console.warn(`CSS at '${path}' not found`);
							return [undefined] as const;
						}
						return [via._noterra_parseCSS(await file.async("text"))] as const;
					})())[0];
				} else {
					const cssStr = css.textContent;
					if (!cssStr) continue;
					ruleset = via._noterra_parseCSS(cssStr);
				}
				if (!ruleset) continue;
				for (const rule of await iterRemoteArr(ruleset.cssRules))
					if (rule.type === rule.STYLE_RULE /* .type needed here due to via.js not work with instanceof */) {
						const rl = rule as CSSStyleRule;
						const styles = await get(rl.style.cssText);
						const els = dom.querySelectorAll(await get(rl.selectorText) as string);
						// if (els.length) console.log([...els], styles);
						for (const el of await iterRemoteArr(els)) {
							const oldStyle =
								(await get(el.getAttribute("styles")) as string | null)
									?.replace(/;\s*$/, "") ?? "";
							el.setAttribute("style", `${oldStyle};${styles}`);
						}
					}
			}
			for (const unsupported of await iterRemoteArr(dom.querySelectorAll("section"))) {
				if (await get(unsupported.hasAttribute("style"))) {
					const nw = dom.createElement("div");
					nw.setAttribute("style", unsupported.getAttribute("style") ?? "");
					nw.append(...await iterRemoteArr(unsupported.childNodes));
					unsupported.replaceWith(nw);
					continue;
				}
				unsupported.replaceWith(...await iterRemoteArr(unsupported.childNodes));
			}
			// Cover images
			// TODO: dont like special casing
			if (
				dom.body.textContent?.trim() === "" &&
				dom.body.querySelector("img")
			) {
				dom.body.replaceChildren(...dom.body.querySelectorAll("img"));
			}
			return [dom];
		})))),
	)).flat(1).map(el => el[0]);
	const content = (await Promise.all(
		spine.map(
			async (doc) => `<section>${await get(doc.body.innerHTML)}</section>`,
		),
	)).join("");
	return {
		attachments,
		content,
	};
}

type handleEPubCallback = typeof handleEPub;
declare global {
	interface WorkerGlobalScope {
		handleEPub: handleEPubCallback;
	}
	const handleEpub: handleEPubCallback;
}
self.handleEPub = handleEPub;

const TRANSFERABLES: Transferable[] = [];

Via.postMessage = data => {
	self.postMessage(data, {
		transfer: TRANSFERABLES,
	});
	TRANSFERABLES.length = 0;
};
self.addEventListener("message", async (e: MessageEvent) => {
	if (e.data.type === "NOTERRA-handle-epub") {
		const contents = await handleEPub(e.data.file, e.data.IMAGE_THEMATIC_CLASS);
		self.postMessage({
			type: "NOTERRA-handle-epub",
			id: e.data.id,
			contents,
		});
	} else Via.onMessage(e.data);
});

export default WorkerGlobalScope;
