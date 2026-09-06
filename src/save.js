import { createState, validateState } from "./simulation.js";
export let loadNotice = "";
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ant-life-rpg", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("colony");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function load() {
  loadNotice = "";
  const db = await database();
  try {
    const values = await new Promise((resolve, reject) => {
      const tx = db.transaction("colony");
      const store = tx.objectStore("colony");
      const current = store.get("current"),
        backup = store.get("backup");
      tx.oncomplete = () => resolve([current.result, backup.result]);
      tx.onabort = tx.onerror = () =>
        reject(tx.error ?? new Error("Save read aborted"));
    });
    if (validateState(values[0])) return values[0];
    if (validateState(values[1])) {
      loadNotice = "Recovered the colony from its previous autosave.";
      return values[1];
    }
    if (values.every((v) => v === undefined)) return createState();
    throw new Error(
      "The saved colony could not be loaded. Existing save data has been left untouched.",
    );
  } finally {
    db.close();
  }
}
export async function save(state) {
  const snapshot = structuredClone(state);
  if (!validateState(snapshot))
    throw new Error("Invalid colony state; previous saves preserved");
  const db = await database();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction("colony", "readwrite");
      const store = tx.objectStore("colony");
      const previous = store.get("current");
      previous.onsuccess = () => {
        if (validateState(previous.result))
          store.put(previous.result, "backup");
        store.put(snapshot, "current");
      };
      tx.oncomplete = resolve;
      tx.onabort = tx.onerror = () =>
        reject(tx.error ?? new Error("Save transaction aborted"));
    });
  } finally {
    db.close();
  }
}
