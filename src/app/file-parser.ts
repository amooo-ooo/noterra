import { type File as FileData, LocalFile } from "./components/editor-files";
if (typeof self !== "undefined") import("via.js/receiver");
import type EPubWorkerGlobal from "./workers/epub-parser";

declare const ViaReceiver: Omit<typeof window.ViaReceiver, keyof Window | keyof typeof globalThis>
	& { postMessage: typeof postMessage; }
	& EPubWorkerGlobal;

import { IMAGE_THEMATIC_CLASS } from "./editor-extensions/blob-imgs";

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

declare global {
	interface Window {
		_noterra_parseCSS: typeof parseCSS;
	}
	const _noterra_parseCSS: typeof parseCSS;
}
if (typeof window !== "undefined") window._noterra_parseCSS = parseCSS;

export type RecieverGlobal = typeof window;

let WORKER: Worker | null;
const TRANSFER: Transferable[] = [];

function worker() {
	if (typeof window === "undefined") return null;
	WORKER ??= new window.Worker("/js/worker.js");
	WORKER.onmessage = (e => e.data.type === "NOTERRA-handle-epub"
		? AWAITING[e.data.id](e.data.contents)
		: ViaReceiver.OnMessage(e.data));
	ViaReceiver.postMessage = data => {
		WORKER?.postMessage(data, {
			transfer: TRANSFER,
		});
		TRANSFER.length = 0;
	};
	return WORKER;
}

type EPubResponse = { content: string, attachments: Record<string, Blob>; };
const AWAITING: Record<number, (result: EPubResponse) => void> = {};
let awaitingIds = 0;

export async function handleFile(
	id: FileData["id"],
	file: File,
): Promise<LocalFile> {
	switch (file.type) {
		case "application/epub+zip": {
			const w = worker();
			const { content, attachments } = await new Promise<EPubResponse>(res => {
				const id = awaitingIds++;
				w?.postMessage(
					{
						type: "NOTERRA-handle-epub",
						file,
						IMAGE_THEMATIC_CLASS,
						id,
					},
				);
				AWAITING[id] = res;
			});
			return new LocalFile(id, file.name, content, attachments);
			// const zip = await JSZip.loadAsync(file);
			// return handleEPub(id, file.name, zip);
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
