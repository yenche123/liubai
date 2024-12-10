import type { Theme } from 'vitepress'
import DefaultTheme from "vitepress/theme";
import CustomLayout from "./Layout.vue";
import CopyButton from "../components/copy-button/copy-button.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: CustomLayout,
  enhanceApp({ app }) {
    app.component("CopyButton", CopyButton);
  }
} satisfies Theme

