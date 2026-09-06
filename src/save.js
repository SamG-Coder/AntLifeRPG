import { createState, validateState } from "./simulation.js";
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ant-life-rpg", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("colony");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function load() {
  try {
    const db = await database();
    const value = await new Promise((resolve, reject) => {
      const request = db
        .transaction("colony")
        .objectStore("colony")
        .get("current");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return validateState(value) ? value : createState();
  } catch (error) {
    console.warn("Save storage unavailable", error);
    return createState();
  }
}
export async function save(state) {
  const db = await database();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("colony", "readwrite");
    tx.objectStore("colony").put(structuredClone(state), "current");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
