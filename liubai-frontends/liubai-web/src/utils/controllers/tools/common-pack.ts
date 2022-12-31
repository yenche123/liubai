import { LiuContent } from "../../../types/types-atom";


/**
 * 判断有没有 title，若有加到 content 里
 */
function packLiuDesc(
  liuDesc: LiuContent[] | undefined,
  title?: string,
) {
  if(!title) return liuDesc
  let newDesc = liuDesc ? JSON.parse(JSON.stringify(liuDesc)) as LiuContent[] : []
  const h1: LiuContent = {
    type: "heading",
    attrs: {
      level: 1,
    },
    content: [
      {
        "type": "text",
        "text": title
      }
    ]
  }
  newDesc.splice(0, 0, h1)
  return newDesc
}


export default {
  packLiuDesc
}