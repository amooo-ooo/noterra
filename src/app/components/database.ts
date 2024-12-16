type Override<T, U> = Omit<T, keyof U> & U;

type DatabaseVersionHandler<T> = (
	db: Override<
		IDBDatabase,
		{
			createObjectStore(): IDBObjectStore;
			createObjectStore<S extends keyof T>(
				name: S,
				options?: Override<IDBObjectStoreParameters, { keyPath: keyof T[S] }>,
			): IDBObjectStore;
		}
	>,
) => void;

type ObjectStoreTypeOverrides<T> = {
	/**
	 * Adds or updates a record in store with the given value and key.
	 *
	 * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
	 *
	 * If put() is used, any existing record with the key will be replaced. If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
	 *
	 * If successful, request's result will be the record's key.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/IDBObjectStore/put)
	 */
	put(value: T, key?: IDBValidKey): IDBRequest<IDBValidKey>;
	/**
	 * Adds or updates a record in store with the given value and key.
	 *
	 * If the store uses in-line keys and key is specified a "DataError" DOMException will be thrown.
	 *
	 * If put() is used, any existing record with the key will be replaced. If add() is used, and if a record with the key already exists the request will fail, with request's error set to a "ConstraintError" DOMException.
	 *
	 * If successful, request's result will be the record's key.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/IDBObjectStore/add)
	 */
	add(value: T, key?: IDBValidKey): IDBRequest<IDBValidKey>;
	/**
	 * Retrieves the value of the first record matching the given key or key range in query.
	 *
	 * If successful, request's result will be the value, or undefined if there was no matching record.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/IDBObjectStore/get)
	 */
	get(query: IDBValidKey | IDBKeyRange): IDBRequest<T | undefined>;
};
export type TypedObjectStore<T> = Override<
	IDBObjectStore,
	ObjectStoreTypeOverrides<T>
>;
type TransactionTypeOverrides<T> = {
	objectStore<S extends keyof T>(name: S): TypedObjectStore<T[S]>;
};
export type TypedTransaction<T> = Override<
	IDBTransaction,
	TransactionTypeOverrides<T>
>;

export class DatabaseHandler<T> {
	#db?: IDBDatabase;
	#versionHandlers: DatabaseVersionHandler<T>[];
	DB_NAME: string;
	DB_VERSION: number;

	constructor(name: string, versionHandlers: DatabaseVersionHandler<T>[]) {
		this.DB_NAME = name;
		this.DB_VERSION = versionHandlers.length;
		this.#versionHandlers = versionHandlers;
	}

	async initDB() {
		if (this.#db) return this.#db;
		const dbReq = indexedDB.open(this.DB_NAME, this.DB_VERSION);
		dbReq.addEventListener("upgradeneeded", (e) => {
			const db = dbReq.result;
			for (let i = e.oldVersion; i < this.DB_VERSION; i++) {
				this.#versionHandlers[i](
					db as Parameters<DatabaseVersionHandler<T>>[0],
				);
			}
		});
		this.#db = await DatabaseHandler.prepare(dbReq);
		this.#db.addEventListener("versionchange", () => this.#db?.close?.());
		this.#db.addEventListener("close", () => {
			this.#db = undefined;
		});
		return this.#db;
	}

	async transaction(
		storeNames: (keyof T & string) | (keyof T & string)[],
		mode: IDBTransactionMode = "readonly",
		options?: IDBTransactionOptions,
	) {
		const db = await this.initDB();
		return db.transaction(storeNames, mode, options) as TypedTransaction<T>;
	}

	async openStore<S extends string & keyof T>(
		store: S,
		accessMode: IDBTransactionMode = "readonly",
	) {
		const transaction = await this.transaction(store, accessMode);
		return transaction.objectStore(store) as TypedObjectStore<T[S]>;
	}

	async *iterStore<S extends string & keyof T>(
		store: S,
		accessMode: IDBTransactionMode = "readonly",
		...cursorOptions: Parameters<typeof IDBObjectStore.prototype.openCursor>
	) {
		const storeHandle = await this.openStore(store, accessMode);
		for await (const item of DatabaseHandler.iterCursor(
			storeHandle,
			...cursorOptions,
		)) {
			yield item;
		}
	}

	static async prepare<T>(request: IDBRequest<T>) {
		return await new Promise<T>((res, rej) => {
			request.addEventListener("error", () => rej(request.error));
			request.addEventListener("success", () => res(request.result));
		});
	}

	static async *iterCursor<T = object>(
		store: TypedObjectStore<T>,
		...cursorOptions: Parameters<typeof IDBObjectStore.prototype.openCursor>
	) {
		const cursor = store.openCursor(...cursorOptions);
		while (true) {
			await new Promise((res, rej) => {
				cursor.onsuccess = res;
				cursor.onerror = () => rej(cursor.error);
			});
			const result = cursor.result;
			if (!result) return;
			yield result as Override<IDBCursorWithValue, { value: T }>;
			result.continue();
		}
	}
}

export interface DBView<T> {
	serialize(): T;
}

export type DBStructure<T> = T extends DatabaseHandler<infer U> ? U : never;
export type DBStore<DB, S extends keyof DBStructure<DB>> = DBStructure<DB>[S];
