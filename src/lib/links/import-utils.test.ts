import { test, expect } from "bun:test";
import { normalizeUrl, parseUrlUpdateMarkdown } from "./import-utils";

test("normalizeUrl: strips www, trailing slash, lowercases host, keeps path+search, drops hash", () => {
  expect(normalizeUrl("https://www.SEC.gov/")).toBe("sec.gov");
  expect(normalizeUrl("http://openinsider.com/")).toBe("openinsider.com");
  expect(normalizeUrl("https://openinsider.com/")).toBe("openinsider.com");
  expect(normalizeUrl("https://fred.stlouisfed.org/series/M2SL")).toBe(
    "fred.stlouisfed.org/series/M2SL",
  );
  expect(
    normalizeUrl(
      "https://docs.google.com/spreadsheets/d/1x/edit?gid=2086608733#gid=2086608733",
    ),
  ).toBe("docs.google.com/spreadsheets/d/1x/edit?gid=2086608733");
});

test("parseUrlUpdateMarkdown: parses tabs, categories, mango author, nefcon episodes", () => {
  const md = [
    "# 🗂 탭 1 — 네프콘",
    "## 1. 🏛️ 공시 / 내부자 거래",
    "### DART (전자공시시스템)",
    "https://dart.fss.or.kr/",
    "- 014. 3년 안에 자산 10배 만드는 매수, 매도 신호 확인법",
    "- 075. 재무제표 숨겨진 의미를 꿰뚫어 보는 방법 1편",
    "",
    "# 🗂 탭 2 — 망고가 만든 것",
    "## 1. 📚 공부 가이드",
    "### 9회독 읽기 방법",
    "https://www.threads.com/@ditto_note/post/DQIVTtNElHR",
    "_by @ditto_note_",
  ].join("\n");

  const rows = parseUrlUpdateMarkdown(md);
  expect(rows.length).toBe(2);

  const dart = rows[0];
  expect(dart.tab).toBe("nefcon");
  expect(dart.category).toBe("공시 / 내부자 거래");
  expect(dart.title).toBe("DART (전자공시시스템)");
  expect(dart.url).toBe("https://dart.fss.or.kr/");
  expect(dart.author).toBeNull();
  expect(dart.episodes).toEqual([
    { no: "014", title: "3년 안에 자산 10배 만드는 매수, 매도 신호 확인법" },
    { no: "075", title: "재무제표 숨겨진 의미를 꿰뚫어 보는 방법 1편" },
  ]);

  const threads = rows[1];
  expect(threads.tab).toBe("mango");
  expect(threads.category).toBe("공부 가이드");
  expect(threads.author).toBe("@ditto_note");
  expect(threads.episodes).toBeNull();
});
