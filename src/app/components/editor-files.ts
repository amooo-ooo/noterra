import { DatabaseHandler } from "./database";
import type { Editor as TipTapEditor } from "@tiptap/react";

type FileEvents = Record<"save" | "delete", ((file: File) => void)[]>;
type ItemOf<T> = T extends Iterable<infer R> ? R : never;

export abstract class File {
	static #listeners: FileEvents = {
		save: [],
		delete: [],
	};

	#open = false;
	readonly id: string;
	name: string;
	content: string;
	readonly attachments: Record<string, Blob>;

	constructor(
		id: string,
		name?: string,
		content = "",
		attachments: Record<string, Blob> = {},
	) {
		this.id = id;
		this.name = name ?? id;
		this.content = content;
		this.attachments = attachments;
	}

	setOpenFlag(value: boolean) {
		this.#open = value;
	}

	isOpen() {
		return this.#open;
	}

	static on<E extends keyof FileEvents>(
		event: E,
		callback: ItemOf<FileEvents[E]>,
	) {
		File.#listeners[event].push(callback);
		return {
			dispose: () => File.#listeners[event].filter((x) => x !== callback),
		};
	}

	abstract save(): Promise<void>;

	abstract delete(): Promise<void>;

	protected dispatch(event: keyof FileEvents) {
		for (const callback of File.#listeners[event]) {
			callback(this);
		}
	}
}

export class TabData {
	readonly id: File["id"];
	readonly file: File;
	editor?: TipTapEditor;
	lastKeyPress?: KeyboardEvent["key"];
	scrollingElement?: HTMLElement;
	scrollPos = 0;
	locked = false;
	index?: number;
	tryIndex?: number;
	initialSelection?: object | null;
	boundURLs: Record<keyof File["attachments"], string> = {};
	#stateTimer: ReturnType<typeof setTimeout> | null = null;
	#fileTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(file: File) {
		this.file = file;
		file.setOpenFlag(true);
		this.id = file.id;
	}

	serialize(): SerialEditor {
		return {
			index: this.index ?? 0,
			fileId: this.file.id,
			scrollPos: this.scrollPos ?? 0,
			selection: this.editor?.state.selection.toJSON() ?? null,
			locked: !!this.locked,
		};
	}

	clone() {
		const newObj = new TabData(this.file);
		newObj.editor = this.editor;
		newObj.lastKeyPress = this.lastKeyPress;
		newObj.scrollingElement = this.scrollingElement;
		newObj.scrollPos = this.scrollPos;
		newObj.locked = this.locked;
		newObj.tryIndex = this.tryIndex;
		newObj.initialSelection = this.initialSelection;
		newObj.boundURLs = this.boundURLs;
		return newObj;
	}

	withToggleLock() {
		const newObj = this.clone();
		newObj.locked = !newObj.locked;
		return newObj;
	}

	dirtyState() {
		if (!this.#stateTimer) {
			this.saveState();
			this.#stateTimer = setTimeout(() => {
				this.#stateTimer = null;
			}, 10e3);
		}
	}

	dirtyFile() {
		if (!this.#fileTimer) {
			this.saveFile();
			this.#fileTimer = setTimeout(() => {
				this.#fileTimer = null;
			}, 3e3);
		}
	}

	async saveState() {
		const editors = await LocalFile.db.openStore("editors", "readwrite");
		editors.put(this.serialize());
	}

	async saveFile() {
		this.file.content = this.editor?.getHTML() ?? this.file.content;
		await this.file.save();
	}

	async save() {
		await Promise.all([this.saveFile(), this.saveState()]);
	}
}

export interface SerialEditor {
	index: number;
	fileId: File["id"];
	scrollPos: number;
	locked: boolean;
	selection: object | null;
}

export class LocalFile extends File {
	static readonly db = new DatabaseHandler<{
		files: LocalFile;
		editors: SerialEditor;
	}>("noterra-local", [
		(db) => {
			db.createObjectStore("files", {
				keyPath: "id",
			});
			db.createObjectStore("editors", {
				keyPath: "fileId",
			});
		},
	]);

	async save() {
		const store = await LocalFile.db.openStore("files", "readwrite");
		store.put({ ...this });
		this.dispatch("save");
	}

	async delete() {
		const store = await LocalFile.db.openStore("files", "readwrite");
		store.delete(this.id);
		this.dispatch("delete");
	}

	static async *editors() {
		const transaction = await LocalFile.db.transaction(
			["files", "editors"],
			"readonly",
		);
		const files = transaction.objectStore("files");
		const editors = transaction.objectStore("editors");
		for await (const editor of DatabaseHandler.iterCursor(editors)) {
			const file = await DatabaseHandler.prepare(
				files.get(editor.value.fileId),
			);
			if (!file) continue; // TODO: raise error to user?
			const tab = new TabData(
				new LocalFile(file.id, file.name, file.content, file.attachments),
			);
			tab.locked = editor.value.locked;
			tab.scrollPos = editor.value.scrollPos;
			tab.tryIndex = editor.value.index;
			tab.initialSelection = editor.value.selection;
			yield tab as Omit<TabData, "tryIndex"> & {
				tryIndex: NonNullable<TabData["tryIndex"]>;
			};
		}
	}

	static async *files() {
		for await (const file of LocalFile.db.iterStore("files", "readonly")) {
			yield new LocalFile(
				file.value.id,
				file.value.name,
				file.value.content,
				file.value.attachments,
			);
		}
	}
}
