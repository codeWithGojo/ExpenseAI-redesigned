// Only used by the public Vercel build. Private Sites continue using their API.
export const browserMode = process.env.NEXT_PUBLIC_STORAGE_MODE === "browser";

export function browserStore<T>(name: string, initial: () => T) {
  let connection: Promise<IDBDatabase> | undefined;
  function open() {
    if (!connection) connection = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") { reject(new Error("This browser cannot save records. Use a browser with site storage enabled.")); return; }
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("records");
      request.onsuccess = () => { request.result.onversionchange = () => {request.result.close(); connection = undefined;}; resolve(request.result); };
      request.onerror = () => { connection = undefined; reject(new Error("Site storage is unavailable. Check your browser settings.")); };
      request.onblocked = () => { connection = undefined; reject(new Error("Close other tabs for this site, then try again.")); };
    });
    return connection;
  }
  return async function run<R>(write: boolean, operation: (state: T) => R): Promise<R> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("records", write ? "readwrite" : "readonly");
      const store = transaction.objectStore("records");
      const request = store.get("state");
      let result: R;
      let failure: unknown;
      request.onsuccess = () => {
        try {const state: T = request.result === undefined ? initial() : request.result; result = operation(state); if (write) store.put(state, "state");}
        catch (error) {failure = error; transaction.abort();}
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = transaction.onerror = () => reject(failure || new Error("Could not save records on this browser. Free some site storage and try again."));
    });
  };
}
