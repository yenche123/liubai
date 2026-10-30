import { describe, expect, it } from "vitest"
import { Schema } from "@tiptap/pm/model"
import { AllSelection, EditorState, NodeSelection, TextSelection } from "@tiptap/pm/state"
import { createHighlightRefresh } from "./refresh-highlighting"

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "text*" },
    codeBlock: { group: "block", content: "text*", code: true },
    text: {},
  },
})
const paragraph = schema.node("paragraph", null, schema.text("before"))
const code = schema.node("codeBlock", null, schema.text("const x = 1"))
const doc = schema.node("doc", null, [paragraph, code, paragraph])
const pos = paragraph.nodeSize

describe("async code highlighting refresh", () => {
  it.each([
    ["cursor in code", TextSelection.create(doc, pos + 3)],
    ["forward selection", TextSelection.create(doc, pos + 2, pos + 7)],
    ["backward selection", TextSelection.create(doc, pos + 7, pos + 2)],
    ["selection crossing the code boundary", TextSelection.create(doc, 2, pos + 4)],
    ["cursor outside code", TextSelection.create(doc, 2)],
    ["selected code block", NodeSelection.create(doc, pos)],
    ["select all", new AllSelection(doc)],
  ])("preserves %s and document content", (_, selection) => {
    const state = EditorState.create({ doc, selection })
    const tr = createHighlightRefresh(state, pos)!
    const next = state.apply(tr)
    expect(tr.docChanged).toBe(true)
    expect(tr.getMeta("addToHistory")).toBe(false)
    expect(next.doc.eq(doc)).toBe(true)
    expect(next.selection.toJSON()).toEqual(selection.toJSON())
  })

  it("ignores a position that is no longer a code block", () => {
    const state = EditorState.create({ doc: schema.node("doc", null, [paragraph]) })
    expect(createHighlightRefresh(state, 0)).toBeUndefined()
  })
})
