export interface MenuItem {
  text: string
  iconName?: string
  color?: string
  borderBottom?: boolean
  children?: MenuItem[]
  [otherKey: string]: any
}

export interface Props {
  menu: MenuItem[]
}