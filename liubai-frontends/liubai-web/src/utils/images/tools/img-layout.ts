import type { ImageShow, LiuImageStore } from "~/types"
import type { 
  ImgLayout,
  ImgOneLayout,
  ImgTwoLayout,
} from "~/types/other/types-custom"

/**
 * 获取图片的布局信息
 */
export function getImgLayout(
  images?: ImageShow[],
): ImgLayout | undefined {
  if(!images || images.length < 1) return

  const len = images.length
  if(len === 1) {
    let one = _handleOneImg(images[0])
    return { one }
  }
  else if(len === 2) {

  }

}

function _handleOneImg(
  img: ImageShow,
): ImgOneLayout {

  let imgWidthPx = img.width
  let maxWidthPx = 450
  let h2w = Number(img.h2w)
  if(!h2w || isNaN(h2w)) h2w = 1

  if(h2w > 2.2) h2w = 2.2
  if(h2w < 0.4) h2w = 0.4

  if(h2w < 1.01) {
    // 第 1 段
    // 高宽比小于等于 1 时，此时图片是横宽版式的

    maxWidthPx = -200 * h2w + 600
  }
  else {
    // 第 2 段
    // 此时图片是竖直版式的

    maxWidthPx = -120 * h2w + 470
  }

  // 最后限制 maxWidthPx
  if(imgWidthPx) {
    if(maxWidthPx > imgWidthPx) maxWidthPx = imgWidthPx
  }
  if(maxWidthPx > 700) maxWidthPx = 700
  if(maxWidthPx < 200) maxWidthPx = 200
  

  let heightStr = `${Math.round(h2w * 100)}%`

  return { maxWidthPx, heightStr }
}