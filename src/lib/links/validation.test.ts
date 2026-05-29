import { test, expect } from "bun:test";
import { validateLinkInput } from "./validation";

const base = { title: "T", url: "https://example.com", categoryId: "c1" };

test("author optional: missing author is OK (null)", () => {
  const r = validateLinkInput({ ...base });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.author).toBeNull();
});

test("author normalized with @ when present", () => {
  const r = validateLinkInput({ ...base, author: "foo" });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.author).toBe("@foo");
});

test("episodes validated and trimmed", () => {
  const r = validateLinkInput({
    ...base,
    episodes: [
      { no: "014", title: " 제목 " },
      { no: "", title: "" },
    ],
  });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.episodes).toEqual([{ no: "014", title: "제목" }]);
});

test("invalid url rejected", () => {
  const r = validateLinkInput({ ...base, url: "ftp://x" });
  expect(r.ok).toBe(false);
});

test("missing title rejected", () => {
  const r = validateLinkInput({ ...base, title: "" });
  expect(r.ok).toBe(false);
});
