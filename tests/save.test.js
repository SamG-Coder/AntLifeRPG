import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { createState } from "../src/simulation.js";
import { load, save, loadNotice } from "../src/save.js";
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});
async function records(action) {
  const db = await new Promise((resolve, reject) => {
    const r = indexedDB.open("ant-life-rpg", 1);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("colony", "readwrite");
      const result = action(tx.objectStore("colony"), tx);
      tx.oncomplete = () => resolve(result?.result);
      tx.onabort = () => reject(tx.error ?? new Error("aborted"));
    });
  } finally {
    db.close();
  }
}
test("autosave retains an independent previous valid generation", async () => {
  const s = await load();
  await save(s);
  s.day = 2;
  await save(s);
  s.day = 9;
  assert.equal((await load()).day, 2);
  assert.equal((await records((store) => store.get("backup"))).day, 1);
});
test("a corrupt primary recovers the backup without rotating corruption into it", async () => {
  const s = createState();
  await load();
  await save(s);
  s.day = 2;
  await save(s);
  await records((store) => store.put({ version: 1, npcs: [null] }, "current"));
  const recovered = await load();
  assert.equal(recovered.day, 1);
  assert.match(loadNotice, /Recovered/);
  await save(recovered);
  assert.equal((await records((store) => store.get("backup"))).day, 1);
});
test("unrecoverable data is preserved and never silently replaced by a new colony", async () => {
  await load();
  const corrupt = { version: 99, important: "retained" };
  await records((store) => store.put(corrupt, "current"));
  await assert.rejects(load, /left untouched/);
  assert.deepEqual(await records((store) => store.get("current")), corrupt);
});
test("invalid live identities cannot overwrite the last saved colony", async () => {
  await load();
  const s = createState();
  await save(s);
  s.npcs[0].x = NaN;
  await assert.rejects(save(s), /Invalid colony/);
  assert.equal((await load()).npcs[0].x, createState().npcs[0].x);
});

test("an aborted autosave preserves both committed generations", async () => {
  await load();
  const s = createState();
  await save(s);
  s.day = 2;
  await save(s);
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (value, key) {
    const request = original.call(this, value, key);
    if (key === "current" && value.day === 3) this.transaction.abort();
    return request;
  };
  try {
    s.day = 3;
    await assert.rejects(save(s), /abort/i);
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  assert.equal((await load()).day, 2);
  assert.equal((await records((store) => store.get("backup"))).day, 1);
});
