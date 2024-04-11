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
    let two = _handleTwoImgs(images)
    return { two }
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

    maxWidthPx = -200 * h2w + 550
  }
  else {
    // 第 2 段
    // 此时图片是竖直版式的

    maxWidthPx = -120 * h2w + 430
  }

  // 最后限制 maxWidthPx
  if(imgWidthPx) {
    if(maxWidthPx > imgWidthPx) maxWidthPx = imgWidthPx
  }
  if(maxWidthPx > 600) maxWidthPx = 600
  if(maxWidthPx < 100) maxWidthPx = 100
  

  let heightStr = `${Math.round(h2w * 100)}%`

  return { maxWidthPx, heightStr }
}

function _handleTwoImgs(
  images: ImageShow[],
): ImgTwoLayout {
  let heightStr = ""
  let maxWidthPx = 450
  let isColumn = false

  let horizontalNum = 0
  let sum_h2w = 0
  let len = images.length
  images.forEach(v => {
    let h2w = Number(v.h2w)
    if(!h2w || isNaN(h2w)) h2w = 1
    if(h2w <= 0.9) horizontalNum++
    sum_h2w += h2w
  })
  if(horizontalNum === len) {
    isColumn = true
  }

  let avg_h2w = sum_h2w / len
  let box_h2w = 1
  if(isColumn) {
    // 竖直排列时
    box_h2w = avg_h2w * 2
  }
  else {
    // 水平排列时
    box_h2w = avg_h2w / 2
  }

  if(box_h2w < 1.01) {
    maxWidthPx = -200 * box_h2w + 600
  }
  else {
    maxWidthPx = -120 * box_h2w + 470
  }

  if(maxWidthPx > 750) maxWidthPx = 750
  if(maxWidthPx < 100) maxWidthPx = 100

  if(box_h2w < 0.3) box_h2w = 0.3
  if(box_h2w > 4) box_h2w = 4

  heightStr = `${Math.round(box_h2w * 100)}%`

  return { maxWidthPx, heightStr, isColumn }
}