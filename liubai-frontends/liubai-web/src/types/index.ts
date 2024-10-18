import type { RouteLocation } from 'vue-router'
import type { SpaceType } from "./types-basic"
import type { HeTreeStat } from './other/types-hetree'
import type { TagView } from './types-atom'

export type LiuTagTreeStat = HeTreeStat<TagView>

export interface LiuFileStore {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  suffix: string             // 后缀的英文
  size: number               // 单位为 bytes
  mimeType: string
  arrayBuffer?: ArrayBuffer
  cloud_url?: string
}

export interface FileShow {
  id: string
  name: string
  suffix: string   // 后缀的英文
  size: number     // 单位为 bytes
  cloud_url?: string
  src?: string     // blob:http://......
}


/** 当前有采集的「可交换图像文件格式」
 *    注意: 其每个属性都必须是可选的，因为都不见得会存在
*/
export interface LiuExif {
  gps?: {
    latitude?: string
    longitude?: string
    altitude?: string
  }
  DateTimeOriginal?: string    // 原始拍摄时间，形如 "YYYY:MM:DD hh:mm:ss"
  HostComputer?: string     // 宿主设备，如果图片经过软件再编辑，此值可能缺省
  Model?: string            // 拍摄时的设备，即使图片经过软件再编辑，此值仍可能存在
}

export interface LiuImageStore {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  mimeType: string
  arrayBuffer?: ArrayBuffer
  width?: number
  height?: number
  h2w?: string
  cloud_url?: string
  cloud_url_2?: string       // 云端低分辨率的图片
  blurhash?: string
  someExif?: LiuExif
  size?: number              // 单位为 bytes
}

export interface ImageShow {
  src: string
  id: string
  width?: number
  height?: number
  h2w?: string
  blurhash?: string
}

export interface LiuUser {
  local_id: string
  user_id?: string
  token?: string
  createdStamp: number
  lastRefresh: number
}

export interface LiuMyContext {
  userId: string
  memberId: string
  spaceId: string
  spaceType: SpaceType
}

export type LiuFileAndImage = LiuFileStore | LiuImageStore

export type ToRoute = RouteLocation & { href: string }