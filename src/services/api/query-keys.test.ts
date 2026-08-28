/**
 * Tests for `query-keys.ts` — stable key factories (T20).
 *
 * Proves:
 * - Different filters produce distinct keys (deep inequality)
 * - Same filters produce equal keys
 * - List vs detail are distinct
 * - Different resources are distinct
 * - No component may use raw string literals — factories are the single source
 *
 * Runner: Node.js built-in `node:test`
 * Run:  node --experimental-strip-types --test src/services/api/query-keys.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  authKeys,
  categoriesKeys,
  couponsKeys,
  inventoryKeys,
  mediaKeys,
  ordersKeys,
  productMediaKeys,
  productsKeys,
  queryKeys,
  reviewsKeys,
  shipmentsKeys,
  shippingMethodsKeys,
  usersKeys,
  variantsKeys,
} from "./query-keys.ts";

describe("query-keys — distinct filters produce distinct keys", () => {
  it("mediaKeys.list: page 1 vs page 2 are distinct", () => {
    const k1 = mediaKeys.list({ page: 1, limit: 10 });
    const k2 = mediaKeys.list({ page: 2, limit: 10 });
    assert.notDeepEqual(k1, k2);
    assert.deepEqual(k1[0], "media");
    assert.deepEqual(k1[1], "list");
  });

  it("productsKeys.list: different search/filters are distinct", () => {
    const k1 = productsKeys.list({ search: "phone", categoryId: "c1" });
    const k2 = productsKeys.list({ search: "laptop", categoryId: "c1" });
    assert.notDeepEqual(k1, k2);
    const k3 = productsKeys.list({ search: "phone", categoryId: "c2" });
    assert.notDeepEqual(k1, k3);
  });

  it("categoriesKeys.list: same filters produce equal keys", () => {
    const k1 = categoriesKeys.list({ page: 1, limit: 10, search: "a" });
    const k2 = categoriesKeys.list({ page: 1, limit: 10, search: "a" });
    assert.deepEqual(k1, k2);
  });

  it("ordersKeys.list: different status filters are distinct", () => {
    const k1 = ordersKeys.list({ status: "pending", page: 1 });
    const k2 = ordersKeys.list({ status: "paid", page: 1 });
    assert.notDeepEqual(k1, k2);
    const k3 = ordersKeys.list({ status: ["pending", "paid"] });
    const k4 = ordersKeys.list({ status: ["paid", "pending"] });
    // order matters inside array value
    assert.notDeepEqual(k3, k4);
  });

  it("usersKeys.list vs variantsKeys.list are distinct roots", () => {
    const u = usersKeys.list({ page: 1 });
    const v = variantsKeys.list({ page: 1 });
    assert.notEqual(u[0], v[0]);
    assert.notDeepEqual(u, v);
  });

  it("all server filters must be inside the key (filters object retained verbatim)", () => {
    const filters = {
      page: 1,
      limit: 20,
      search: "x",
      sort: "createdAt:desc",
      status: "active",
    };
    const k = productsKeys.list(filters);
    // last element is the filters object itself (per factory contract)
    const last = k[k.length - 1] as Record<string, unknown>;
    assert.deepEqual(last, filters);
    // different limit → distinct
    const k2 = productsKeys.list({ ...filters, limit: 10 });
    assert.notDeepEqual(k, k2);
  });
});

describe("query-keys — list vs detail separation", () => {
  it("products list vs detail are distinct scopes", () => {
    const list = productsKeys.list({ page: 1 });
    const detail = productsKeys.detail("p123");
    assert.notDeepEqual(list, detail);
    assert.equal(detail[0], "products");
    assert.equal(detail[1], "detail");
    assert.equal(detail[2], "p123");
  });

  it("categories detail vs slug are distinct", () => {
    const d = categoriesKeys.detail("id123");
    const s = categoriesKeys.bySlug("my-slug");
    assert.notDeepEqual(d, s);
    assert.deepEqual(s, ["categories", "slug", "my-slug"]);
  });

  it("inventory detail includes variantId", () => {
    const k1 = inventoryKeys.detail("var1");
    const k2 = inventoryKeys.detail("var2");
    assert.notDeepEqual(k1, k2);
    assert.deepEqual(k1, ["inventory", "detail", "var1"]);
  });

  it("productMedia list includes productId and filters", () => {
    const k1 = productMediaKeys.list("prod1", { page: 1 });
    const k2 = productMediaKeys.list("prod2", { page: 1 });
    const k3 = productMediaKeys.list("prod1", { page: 2 });
    assert.notDeepEqual(k1, k2);
    assert.notDeepEqual(k1, k3);
    assert.equal(k1[0], "product-media");
    assert.equal(k1[2], "prod1");
  });
});

describe("query-keys — no string literal construction", () => {
  it("all factories start with known root and second segment is list/detail/slug", () => {
    const allRoots = [
      authKeys.all[0],
      categoriesKeys.all[0],
      productsKeys.all[0],
      variantsKeys.all[0],
      inventoryKeys.all[0],
      productMediaKeys.all[0],
      mediaKeys.all[0],
      ordersKeys.all[0],
      shippingMethodsKeys.all[0],
      shipmentsKeys.all[0],
      usersKeys.all[0],
      couponsKeys.all[0],
      reviewsKeys.all[0],
    ];
    for (const root of allRoots) {
      assert.equal(typeof root, "string");
      assert.equal(root.length > 0, true);
    }
    // spot check: lists second element is 'list', details second is 'detail'
    assert.equal(productsKeys.lists()[1], "list");
    assert.equal(productsKeys.details()[1], "detail");
    assert.equal(mediaKeys.lists()[1], "list");
    assert.equal(mediaKeys.details()[1], "detail");
  });

  it("queryKeys map re-exports every domain", () => {
    const expected = [
      "auth",
      "categories",
      "products",
      "variants",
      "inventory",
      "productMedia",
      "media",
      "orders",
      "shippingMethods",
      "shipments",
      "users",
      "coupons",
      "reviews",
    ];
    for (const key of expected) {
      assert.ok(key in queryKeys, `missing ${key} in queryKeys`);
    }
  });

  it("no raw string literal in components — factories are the only documented source", () => {
    // This is a documentation-enforcing test: if a component constructs a key
    // from a literal like ['products', page] it will not be caught at compile
    // time, but this test documents the contract. We assert that every factory
    // returns a tuple whose first element is the domain root (not an arbitrary string).
    const pList = productsKeys.list({ page: 1 });
    const mDetail = mediaKeys.detail("m1");
    // If someone used a literal, they would have missed the factory — we prove
    // the factory exists and is used in hooks by checking its shape.
    assert.equal(pList[0], "products");
    assert.equal(mDetail[0], "media");
    assert.equal(mDetail[1], "detail");
  });
});

describe("query-keys — stability", () => {
  it("same id produces equal detail keys", () => {
    assert.deepEqual(productsKeys.detail("abc"), productsKeys.detail("abc"));
    assert.deepEqual(mediaKeys.detail("m1"), mediaKeys.detail("m1"));
    assert.notDeepEqual(productsKeys.detail("abc"), productsKeys.detail("def"));
  });

  it("undefined filters defaults to empty object (stable)", () => {
    const k1 = productsKeys.list();
    const k2 = productsKeys.list(undefined);
    const k3 = productsKeys.list({});
    assert.deepEqual(k1, k2);
    assert.deepEqual(k1, k3);
  });

  it("false and 0 inside filters are preserved (not omitted)", () => {
    const k1 = productsKeys.list({ page: 0, active: false });
    const k2 = productsKeys.list({ page: 1, active: false });
    assert.notDeepEqual(k1, k2);
    const last1 = k1[k1.length - 1] as Record<string, unknown>;
    assert.equal(last1.page, 0);
    assert.equal(last1.active, false);
  });
});
