import { 
  defineConfig, 
  loadEnv,
} from 'vite'
import { resolve } from "node:path"
import { getVitePlugins } from "./build/vite/plugins"
import { vendorCodeSplitting } from "./build/vite/code-splitting"

const { version, author } = require("./package.json")
const projectRoot = process.cwd()

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const nodeVersion = process.version
  console.log("the current node version: ", nodeVersion)

  const _env = loadEnv(mode, projectRoot)
  const isProduction = mode === "production"
  const vitePlugins = getVitePlugins({
    command,
    isProduction,
    env: _env,
    projectRoot,
  })

  return {
    resolve: {
      alias: {
        '~/': `${resolve(projectRoot, 'src')}/`,
        'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js',
      },
      dedupe: [
        '@tiptap/core',
        '@tiptap/pm',
        '@tiptap/vue-3',
        '@tiptap/starter-kit',
        '@tiptap/extensions',
        '@tiptap/extension-blockquote',
        '@tiptap/extension-bold',
        '@tiptap/extension-bullet-list',
        '@tiptap/extension-code',
        '@tiptap/extension-code-block',
        '@tiptap/extension-code-block-lowlight',
        '@tiptap/extension-document',
        '@tiptap/extension-dropcursor',
        '@tiptap/extension-gapcursor',
        '@tiptap/extension-hard-break',
        '@tiptap/extension-heading',
        '@tiptap/extension-horizontal-rule',
        '@tiptap/extension-italic',
        '@tiptap/extension-link',
        '@tiptap/extension-list',
        '@tiptap/extension-list-item',
        '@tiptap/extension-list-keymap',
        '@tiptap/extension-ordered-list',
        '@tiptap/extension-paragraph',
        '@tiptap/extension-strike',
        '@tiptap/extension-text',
        '@tiptap/extension-underline',
      ],
    },
  
    plugins: vitePlugins,
  
    server: {
      host: true,
      port: 5175,
    },
  
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 500,
      rolldownOptions: {
        output: {
          codeSplitting: vendorCodeSplitting,
          strictExecutionOrder: true,
        },
      },
    },

    worker: {
      format: "es",
    },
  
    preview: {
      port: 4175,
    },

    css: {
      preprocessorOptions: {
        scss: {},
        sass: {}
      }
    },
    
    define: {
      "LIU_ENV": {
        version,
        author,
        "client": "web",
      }
    }
  }
})
