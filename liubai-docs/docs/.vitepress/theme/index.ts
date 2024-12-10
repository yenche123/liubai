import DefaultTheme from "vitepress/theme";
import CustomLayout from "./Layout.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: CustomLayout,
}

