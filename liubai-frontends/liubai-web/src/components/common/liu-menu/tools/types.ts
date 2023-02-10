import type { PropType } from 'vue'

export interface MenuItem {
  text_key: string
  iconName?: string
  color?: string
  borderBottom?: boolean
  children?: MenuItem[]
  [otherKey: string]: any
}

export type MenuPlacement = "bottom" | "bottom-start" | "bottom-end" 
| "auto" | "top" | "top-start" | "top-end"

export interface LiuMenuProps {
  menu: MenuItem[]
  container: string
  minWidthStr?: string
  placement: MenuPlacement
  allowMask: boolean
  maskZIndex: string
}

export const liumenu_props = {
  menu: {
    type: Array as PropType<MenuItem[]>,
    default: [],
  },
  container: {
    type: String,
    default: "body"
  },
  minWidthStr: {
    type: String,
  },
  placement: {
    type: String as PropType<MenuPlacement>,
    default: "bottom",
  },
  allowMask: {
    type: Boolean,
    default: true
  },
  maskZIndex: {
    type: String,
    default: "2000"
  },
}