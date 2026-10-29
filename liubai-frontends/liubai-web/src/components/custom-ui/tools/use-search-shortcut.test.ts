import { describe, expect, it } from "vitest"
import { isSearchQueryOpen } from "~/config/atom"

describe("search shortcut route state", () => {
  it.each([
    [{ search: "01" }, true],
    [{ q: "keyword" }, true],
    [{ q: "" }, true],
    [{ q: ["keyword"] }, false],
    [{ search: "00" }, false],
    [{}, false],
  ])("detects an open search query: %o", (query, expected) => {
    expect(isSearchQueryOpen(query)).toBe(expected)
  })
})
