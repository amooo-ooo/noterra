import JSZip from 'jszip';
import { raise, unreachable } from './util';
import { themable } from './img-themable';

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

export type W2MMessage =
	| { type: 'parse-meta-inf', zipId: number, content: ArrayBuffer; }
	| { type: 'parse-rootfile', zipId: number, path: string, content: ArrayBuffer; }
	| { type: 'parse-page', zipId: number, pageId: number, path: string, content: ArrayBuffer; };

export type M2WMessage =
	| { type: 'parse-epub', file: Blob; }
	| { type: 'rootfiles', zipId: number, rootfiles: (string | undefined)[]; }
	| { type: 'rootfile', zipId: number, path: string, title: string, items: Record<string, string>, pages: string[]; }
	| { type: 'handle-images', zipId: number, path: string, paths: string[]; };

let zipId = 0;
const handles: Record<number, {
	zip: JSZip;
	waiting: number;
	items: Record<string, string>;
	pages: string[];
	pageId: number;
	titles: string[];
	attachments: Record<string, [data: ArrayBuffer, type: string, themable: boolean]>;
}> = {};

function resolvePath(handle: typeof handles[keyof typeof handles], base: string, path?: string | null) {
	const relPath = decodeURIComponent(path ?? "");
	// TODO: standard way to do this????
	for (const title of handle.titles) {
		if (relPath.startsWith(`${title}_files`)) {
			return handle.items[relPath.replace(/.*[\\/]([^\\/]*)$/, "$1")];
		}
	}
	return joinPath(base, path ?? "");
}

self.addEventListener('message', async (e) => {
	const msg = e.data as M2WMessage;
	switch (msg.type) {
		case 'parse-epub': {
			const zip = await JSZip.loadAsync(msg.file);
			const id = ++zipId;
			handles[id] = { zip, waiting: 0, items: {}, titles: [], pages: [], pageId: 0, attachments: {} };
			const metaInfF =
				zip.file("META-INF/container.xml") ?? raise("Could not find META-INF");
			const metaInfData = await metaInfF?.async("arraybuffer");
			self.postMessage({
				type: 'parse-meta-inf',
				zipId: id,
				content: metaInfData,
			} satisfies W2MMessage, {
				transfer: [metaInfData]
			});
			break;
		}
		case 'rootfiles': {
			for (const rootfile of msg.rootfiles) {
				const handle = handles[msg.zipId];
				const path = decodeURIComponent(rootfile ?? raise("Rootfile without path"));
				const content = await (
					handle.zip.file(path) ?? raise(`Rootfile '${path}' not found`)
				).async('arraybuffer');
				handle.waiting++;
				self.postMessage({
					type: 'parse-rootfile',
					zipId: msg.zipId,
					path,
					content,
				} satisfies W2MMessage, {
					transfer: [content]
				});
			}
			break;
		}
		case 'rootfile': {
			const handle = handles[msg.zipId];
			handle.waiting--;
			handle.items = {
				...handle.items, ...Object.fromEntries(Object.entries(msg.items).map(([ref, path]) => [
					ref, joinPath(dir(msg.path), decodeURIComponent(path))
				]))
			};
			handle.titles.push(msg.title);
			handle.pages.length += msg.pages.length;
			for (const page of msg.pages) {
				const path = handle.items[page];
				const file =
					handle.zip.file(path) ??
					raise(`Item '${page}' at '${path}' not found`);
				handle.waiting++;
				const content = await file.async("arraybuffer");
				self.postMessage({
					type: 'parse-page',
					zipId: msg.zipId,
					pageId: handle.pageId++,
					path,
					content,
				} satisfies W2MMessage, {
					transfer: [content]
				});
			}
			break;
		}
		case 'handle-images': {
			const handle = handles[msg.zipId];
			for (const imageSrc of msg.paths) {
				const path = resolvePath(
					handle,
					dir(msg.path),
					decodeURIComponent(imageSrc),
				);
				if (!handle.attachments[path]) {
					const file = handle.zip.file(path)
						?? raise(`Image at '${path}' not found`);
					const imgData = await file.async("blob");
					const themedImg = await themable(imgData);
					const blob = themedImg ?? imgData;
					handle.attachments[path] = [await blob.arrayBuffer(), blob.type, !!themedImg];
				}
			}
			break;
		}
		default: unreachable(msg);
	}
});
const cssCache: Record<string, CSSStyleSheet | undefined> = {};
const imgThematic: Record<string, boolean> = {};
const spine = await Promise.all(
	rootfiles.flatMap((file) =>
		[...file.dom.querySelectorAll("spine > itemref")].map(async (item) => {
			const dom = parser.parseFromString(
				await file.async("string"),
				"application/xhtml+xml",
			);
			// TODO: dont like special casing
			for (const img of dom.querySelectorAll<ChildNode & SVGImageElement>("svg > image:only-child")) {
				const newImg = dom.createElement("img");
				newImg.setAttribute("src", img.getAttribute("xlink:href")
					?? raise(`image '${img.outerHTML}' no src`));
				const styles = img.parentElement?.getAttribute("style");
				if (styles) newImg.setAttribute("style", styles);
				img.parentElement?.replaceWith(newImg);
			}
			// Local image files
			for (const img of dom.querySelectorAll("img")) {
				const path = resolvePath(
					dir(items[id].href),
					decodeURIComponent(img.getAttribute("src") ?? ""),
				);
				if (!result.attachments[path]) {
					const file =
						zip.file(path) ?? raise(`Image at '${path}' not found`);
					const imgData = await file.async("blob");
					const themedImg = await themable(imgData);
					if (themedImg) {
						result.attachments[path] = themedImg;
						imgThematic[path] = true;
					} else {
						result.attachments[path] = imgData;
					}
				}
				if (imgThematic[path]) img.classList.add(IMAGE_THEMATIC_CLASS);
				img.removeAttribute("src");
				img.setAttribute("data-blob-src", path);
				img.alt ||= path;
			}
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
						// if (els.length) console.log([...els], styles);
						for (const el of els) {
							const oldStyle =
								el.getAttribute("styles")?.replace(/;\s*$/, "") ?? "";
							el.setAttribute("style", `${oldStyle};${styles}`);
						}
					}
			}
			for (const unsupported of dom.querySelectorAll("section")) {
				if (unsupported.hasAttribute("style")) {
					const nw = dom.createElement("div");
					nw.setAttribute("style", unsupported.getAttribute("style") ?? "");
					nw.append(...unsupported.childNodes);
					unsupported.replaceWith(nw);
					continue;
				}
				unsupported.replaceWith(...unsupported.childNodes);
			}
			// Cover images
			// TODO: dont like special casing
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
console.log(result.content);
return result;
}

window.addEventListener("message", listener);
