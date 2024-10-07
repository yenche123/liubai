import type { LiuImgData } from "~/types/types-view"

export type LiuObjectFit = "fill" | "contain" | "cover" | "none" | "scale-down"

export interface LiuImgStyles {
  objectFit: string
  transition: string
  userSelect: string
  borderRadius: string
  viewTransitionName?: string
}

export interface LiuImgProps {
  src: string
  blurhash?: string
  referrerpolicy: string
  width?: number
  height?: number
  objectFit: LiuObjectFit
  loading: "eager" | "lazy"
  bgColor?: string
  borderRadius?: string
  draggable: boolean
  userSelect: boolean
  disableTransition: boolean
  viewTransitionName?: string
}

export interface LiuImgEmits {
  (evt: "load", data: LiuImgData): void
}