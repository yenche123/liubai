export interface MenuItem {
  text_key: string
  iconName?: string
  color?: string
  borderBottom?: boolean
  children?: MenuItem[]
  [otherKey: string]: any
}

export interface Props {
  menu: MenuItem[]
}