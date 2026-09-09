import assert from "node:assert/strict";
import test from "node:test";
import { renderSitemap } from "../src/lib/seo/sitemap.ts";

const now = Date.parse("2026-09-09T12:00:00Z");
const post = (overrides = {}) => ({
  slug: "article",
  updated_at: "2026-09-01T00:00:00Z",
  published_at: "2026-08-01T00:00:00Z",
  scheduled_at: null,
  ...overrides,
});

test("includes public pages and removes deleted articles on the next render", () => {
  const xml = renderSitemap([post()], now);
  assert.equal((xml.match(/<url>/g) || []).length, 4);
  assert.ok(xml.includes("https://ervis.seferi.pro/blog/article"));
  assert.ok(!renderSitemap([], now).includes("/blog/article"));
  assert.ok(!xml.includes("/admin") && !xml.includes("/login"));
});

test("encodes article slugs and escapes XML without allowing path injection", () => {
  const xml = renderSitemap([post({ slug: "été & <test>/'" })], now);
  assert.ok(xml.includes("/blog/%C3%A9t%C3%A9%20%26%20%3Ctest%3E%2F&apos;"));
  assert.equal((renderSitemap([post({ slug: ".." })], now).match(/<url>/g) || []).length, 3);
});

test("uses stable valid timestamps, including a due publication date", () => {
  const posts = [post({ scheduled_at: "2026-09-08T00:00:00Z" })];
  assert.ok(renderSitemap(posts, now).includes("<lastmod>2026-09-08T00:00:00.000Z</lastmod>"));
  assert.equal(renderSitemap(posts, now), renderSitemap(posts, now + 1000));
  const invalid = post({ updated_at: "invalid", published_at: "2099-01-01" });
  assert.ok(!renderSitemap([invalid], now).includes("<lastmod>"));
});

test("deduplicates URLs and keeps their latest modification", () => {
  const xml = renderSitemap([post(), post({ updated_at: "2026-09-02" })], now);
  assert.equal((xml.match(/<url>/g) || []).length, 4);
  assert.ok(xml.includes("2026-09-02T00:00:00.000Z"));
});
