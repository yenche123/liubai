import type { PluginOption, UserConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { compression as viteCompression } from "vite-plugin-compression2"
import Inspect from "vite-plugin-inspect"
import { qrcode } from "vite-plugin-qrcode"
import { visualizer } from "rollup-plugin-visualizer"
import { VitePWA } from "vite-plugin-pwa"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import copy200Html from "../../deploy/vite-plugin-copy-200"
import { vconsoleAsset } from "./vconsole-asset"
import { svgSymbols } from "./svg-symbols"

interface GetVitePluginsParams {
  command: string
  isProduction: boolean
  env: Record<string, string>
  projectRoot: string
}

export function getVitePlugins({
  command,
  isProduction,
  env,
  projectRoot,
}: GetVitePluginsParams): UserConfig["plugins"] {
  const isBuild = command === "build"
  const plugins: UserConfig["plugins"] = [
    vue(),

    viteCompression({
      threshold: 2048,
    }),

    VitePWA({
      registerType: "prompt",
      manifest: false,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      injectManifest: {
        minify: true,
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,gif,svg}"],
      },
    }),

    svgSymbols(projectRoot),

    vconsoleAsset(),

    copy200Html(),
  ]

  if(!isBuild) {
    plugins.unshift(Inspect())
    plugins.push(qrcode())
  }

  if(isBuild) {
    plugins.push(
      visualizer({
        filename: "analysis.html",
        title: "Liubai Frontend Analysis",
      }) as unknown as PluginOption,
    )
  }

  if(isBuild && isProduction) {
    const {
      VITE_SENTRY_SOURCEMAPS,
      VITE_SENTRY_ORG,
      VITE_SENTRY_PROJECT,
    } = env

    if(
      VITE_SENTRY_SOURCEMAPS === "01" &&
      VITE_SENTRY_ORG &&
      VITE_SENTRY_PROJECT
    ) {
      plugins.push(
        sentryVitePlugin({
          org: VITE_SENTRY_ORG,
          project: VITE_SENTRY_PROJECT,
          telemetry: false,
        }),
      )
    }
  }

  return plugins
}
