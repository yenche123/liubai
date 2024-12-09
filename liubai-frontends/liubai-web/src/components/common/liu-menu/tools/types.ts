import type { PropType } from 'vue'

export interface MenuItem {
  text_key: string
  iconName?: string
  color?: string
  borderBottom?: boolean
  children?: MenuItem[]
  checked?: boolean
  disabled?: boolean
  [otherKey: string]: any
}

export type MenuTrigger = "click" | "hover" | "focus" | "touch"

export type MenuPlacement = "bottom" | "bottom-start" | "bottom-end" 
| "auto" | "top" | "top-start" | "top-end"

export interface LiuMenuProps {
  menu: MenuItem[]
  container: string
  minWidthStr?: string
  placement: MenuPlacement
  allowMask: boolean
  maskZIndex: string
  showTriggers: MenuTrigger[]
  hideTriggers: MenuTrigger[]
  autoHideAfterTappingItem: boolean
  hasCheckbox: boolean
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
  showTriggers: {
    type: Array<MenuTrigger>,
    default: ['click'],
  },
  hideTriggers: {
    type: Array<MenuTrigger>,
    default: ['click'],
  },
  autoHideAfterTappingItem: {
    type: Boolean,
    default: true,
  },
  hasCheckbox: {
    type: Boolean,
    default: false,
  }
}