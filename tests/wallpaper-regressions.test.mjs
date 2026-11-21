import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const testDirectory = fileURLToPath(new URL(".", import.meta.url));

// Exercise the real data functions with an isolated Firestore substitute.
// These tests never connect to Firebase or modify the site's data.
function loadDataModule(file, firestore) {
  const source = fs.readFileSync(path.join(testDirectory, "..", file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === "firebase/firestore") return firestore;
      if (name === "@/lib/firebase/client") return { db: {} };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return exports;
}

function fixture(count, options = {}) {
  const records = Array.from({ length: count }, (_, index) => ({
    id: `wallpaper-${String(index).padStart(4, "0")}`,
    title: `Wallpaper ${index}`,
    // Equal timestamps check the document-ID tie-break across page boundaries.
    createdAt: { seconds: Math.floor(index / 3) },
    isPublished: true,
    categorySlugs: [index % 2 === 0 ? "even" : "odd"],
  }));
  records.push({ id: "draft", isPublished: false, createdAt: { seconds: 99999 } });
  const calls = [];
  const firestore = {
    collection: (_db, name) => name,
    documentId: () => "__name__",
    where: (field, operator, value) => ({ type: "where", field, operator, value }),
    orderBy: (field, direction = "asc") => ({ type: "order", field, direction }),
    limit: (count) => ({ type: "limit", count }),
    startAfter: (document) => ({ type: "cursor", document }),
    query: (collection, ...constraints) => ({ collection, constraints }),
    async getDocs(query) {
      calls.push(query);
      if (options.fail?.(query, calls.length)) {
        throw Object.assign(new Error("Read failed"), { code: options.errorCode ?? "unavailable" });
      }
      if (options.missingIndex && query.constraints.some((c) => c.type === "order" && c.field === "createdAt")) {
        throw Object.assign(new Error("Index required"), { code: "failed-precondition" });
      }
      let items = [...records];
      for (const constraint of query.constraints.filter((c) => c.type === "where")) {
        items = items.filter((item) => constraint.operator === "array-contains"
          ? item[constraint.field]?.includes(constraint.value)
          : item[constraint.field] === constraint.value);
      }
      const order = query.constraints.find((c) => c.type === "order");
      items.sort((a, b) => {
        const value = order?.field === "createdAt"
          ? a.createdAt.seconds - b.createdAt.seconds || a.id.localeCompare(b.id)
          : a.id.localeCompare(b.id);
        return order?.direction === "desc" ? -value : value;
      });
      const cursor = query.constraints.find((c) => c.type === "cursor");
      if (cursor) items = items.slice(items.findIndex((item) => item.id === cursor.document.id) + 1);
      const size = query.constraints.find((c) => c.type === "limit");
      if (size) items = items.slice(0, size.count);
      return { docs: items.map((item) => ({ id: item.id, data: () => item })) };
    },
  };
  return { calls, firestore };
}

async function collectPages(api) {
  let cursor = null;
  const ids = [];
  for (let pageNumber = 0; pageNumber < 30; pageNumber++) {
    const page = await api.listPublishedWallpapersPage(6, cursor);
    ids.push(...page.items.map((item) => item.id));
    if (!page.hasMore) return ids;
    assert.ok(page.cursor, "A non-final page must have a cursor");
    cursor = page.cursor;
  }
  assert.fail("Pagination failed to finish");
}

test("all 137 published wallpapers remain reachable, including tied timestamps", async () => {
  const { firestore } = fixture(137);
  const ids = await collectPages(loadDataModule("lib/firestore/wallpapers.ts", firestore));
  assert.equal(ids.length, 137);
  assert.equal(new Set(ids).size, 137);
  assert.ok(ids.includes("wallpaper-0000"));
  assert.ok(!ids.includes("draft"));
});

test("missing-index fallback keeps one ordering for every page", async () => {
  const { firestore, calls } = fixture(137, { missingIndex: true });
  const ids = await collectPages(loadDataModule("lib/firestore/wallpapers.ts", firestore));
  assert.equal(ids.length, 137);
  assert.equal(new Set(ids).size, 137);
  assert.equal(calls.filter((q) => q.constraints.some((c) => c.field === "createdAt")).length, 1);
});

test("empty galleries and exact page multiples terminate", async () => {
  for (const count of [0, 6, 12]) {
    const { firestore } = fixture(count);
    assert.equal((await collectPages(loadDataModule("lib/firestore/wallpapers.ts", firestore))).length, count);
  }
});

test("a failed later page can retry the same cursor without losing wallpapers", async () => {
  const { firestore, calls } = fixture(40, { fail: (_query, call) => call === 2 });
  const api = loadDataModule("lib/firestore/wallpapers.ts", firestore);
  const first = await api.listPublishedWallpapersPage();
  await assert.rejects(api.listPublishedWallpapersPage(6, first.cursor), { code: "unavailable" });
  assert.equal(calls.length, 2, "Network errors must not change query order");
  const second = await api.listPublishedWallpapersPage(6, first.cursor);
  assert.equal(new Set([...first.items, ...second.items].map((item) => item.id)).size, 12);
});

test("permission errors propagate instead of silently falling back", async () => {
  const { firestore, calls } = fixture(40, { fail: () => true, errorCode: "permission-denied" });
  const api = loadDataModule("lib/firestore/wallpapers.ts", firestore);
  await assert.rejects(api.listPublishedWallpapersPage(), { code: "permission-denied" });
  assert.equal(calls.length, 1);
});

test("an index error after the first page never changes cursor ordering", async () => {
  const { firestore, calls } = fixture(40, { fail: (_query, call) => call === 2, errorCode: "failed-precondition" });
  const api = loadDataModule("lib/firestore/wallpapers.ts", firestore);
  const first = await api.listPublishedWallpapersPage();
  await assert.rejects(api.listPublishedWallpapersPage(6, first.cursor), { code: "failed-precondition" });
  assert.equal(calls.length, 2);
});

test("the default first read requests only six wallpapers", async () => {
  const { firestore, calls } = fixture(137);
  const api = loadDataModule("lib/firestore/wallpapers.ts", firestore);
  const page = await api.listPublishedWallpapersPage();
  assert.equal(page.items.length, 6);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].constraints.find((c) => c.type === "limit").count, 6);
});

test("category pages filter in Firestore and remain limited to six", async () => {
  const { firestore, calls } = fixture(40);
  const api = loadDataModule("lib/firestore/wallpapers.ts", firestore);
  const first = await api.listPublishedWallpapersPage(6, null, "even");
  const second = await api.listPublishedWallpapersPage(6, first.cursor, "even");
  assert.equal(first.items.length, 6);
  assert.equal(second.items.length, 6);
  assert.ok([...first.items, ...second.items].every((item) => item.categorySlugs.includes("even")));
  assert.equal(new Set([...first.items, ...second.items].map((item) => item.id)).size, 12);
  assert.ok(calls.every((q) => q.constraints.some((c) => c.field === "categorySlugs" && c.value === "even")));
  await assert.rejects(api.listPublishedWallpapersPage(6, first.cursor, "odd"), /another category/);
});

test("admin listing has no total cap while dashboard requests keep their explicit limit", async () => {
  const { firestore } = fixture(137);
  const api = loadDataModule("lib/firestore/wallpapers.ts", firestore);
  assert.equal((await api.listWallpapers()).length, 138);
  assert.equal((await api.listRecentWallpapers(6)).length, 6);
});

test("renaming a category preserves its slug, metadata, and wallpaper associations", async () => {
  const category = { nameAr: "Old name", slug: "original-slug", nameEn: "original-slug", isActive: true };
  const wallpaper = { categorySlugs: [category.slug], images: ["existing-photo"] };
  const originalWallpaper = structuredClone(wallpaper);
  const writes = [];
  const api = loadDataModule("lib/firestore/categories.ts", {
    collection: (_db, name) => name,
    doc: (_db, collection, id) => ({ collection, id }),
    serverTimestamp: () => "server-time",
    async updateDoc(ref, data) {
      writes.push({ ref, data });
      Object.assign(category, data);
    },
  });
  await api.updateCategoryName("category-1", "New name");
  assert.equal(category.nameAr, "New name");
  assert.equal(category.slug, "original-slug");
  assert.equal(category.nameEn, "original-slug");
  assert.deepEqual(wallpaper, originalWallpaper);
  assert.ok(wallpaper.categorySlugs.includes(category.slug));
  assert.equal(writes.length, 1);
  assert.equal(writes[0].ref.collection, "categories");
  assert.deepEqual(Object.keys(writes[0].data).sort(), ["nameAr", "updatedAt"]);
});
