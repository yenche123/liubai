import { execFileSync } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "vite"
import { expect, it } from "vitest"
import { vendorCodeSplitting } from "./code-splitting"

it("registers code-block languages after production chunk initialization", async () => {
  const outDir = await mkdtemp(resolve(tmpdir(), "liubai-lowlight-"))
  try {
    await build({
      configFile: false,
      logLevel: "silent",
      build: {
        outDir,
        modulePreload: false,
        lib: {
          entry: resolve("src/utils/other/lowlight-related.ts"),
          formats: ["es"],
          fileName: () => "entry.mjs",
        },
        rolldownOptions: {
          preserveEntrySignatures: "allow-extension",
          output: {
            codeSplitting: vendorCodeSplitting,
            strictExecutionOrder: true,
            chunkFileNames: "[name]-[hash].mjs",
          },
        },
      },
    })

    // Execute emitted chunks in a fresh process, outside Vitest's source loader.
    const output = execFileSync(process.execPath, ["--input-type=module", "-e", `
      import { strict as assert } from "node:assert";
      const api = await import(${JSON.stringify(pathToFileURL(resolve(outDir, "entry.mjs")).href)});
      const { lowlight } = api.initLowlight();
      assert.equal(lowlight.listLanguages().length, 0);
      assert.equal(await api.ensureLowlightLanguages(), true);
      assert.equal(api.lowlightReady.value, true);
      const languages = lowlight.listLanguages();
      assert.equal(languages.length, 38);
      const samples = {
        javascript: "const value = 1;",
        typescript: "const value: number = 1;",
        python: "def greet(): return True",
        dart: "void main() { print('hello'); }",
        xml: "<div>Hello</div>",
      };
      for (const [language, code] of Object.entries(samples)) {
        assert.ok(lowlight.highlight(language, code).children.some(node => node.type === "element"), language);
      }
      for (const label of ["JavaScript", "TypeScript", "Python", "Dart", "HTML", "Plain Text", "Objective-C"]) {
        assert.ok(api.showProgrammingLanguages().includes(label), label);
        assert.ok(lowlight.registered(api.showToSupported(label)), label);
      }
      assert.equal(await api.ensureLowlightLanguages(), false);
      console.log(JSON.stringify(languages));
    `], { encoding: "utf8" })
    expect(JSON.parse(output)).toContain("javascript")
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
}, 30_000)
