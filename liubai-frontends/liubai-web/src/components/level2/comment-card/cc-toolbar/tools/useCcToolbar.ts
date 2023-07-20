
import { computed, ref, watch } from 'vue';
import type { CcToolbarProps, CcToolbarMenuItem } from "./types"
import liuApi from '~/utils/liu-api';
import { LiuTimeout } from '~/utils/basic/type-tool';


// 编辑、删除
const MENU_1: CcToolbarMenuItem[] = [
  {
    text_key: "common.edit",
    operation: "edit",
    iconName: "edit_400"
  },
  {
    text_key: "common.delete",
    operation: "delete",
    iconName: "delete_400",
  },
]

// 举报
const MENU_2: CcToolbarMenuItem[] = [
  {
    text_key: "common.report",
    operation: "report",
    iconName: "report_600"
  }
]



export function useCcToolbar(
  props: CcToolbarProps,
) {

  const cha = liuApi.getCharacteristic()
  const isMobile = cha.isMobile

  let isMenuShow = false
  const expandMore = ref(isMobile)


  let timeout: LiuTimeout
  const setExpandMore = (newV: boolean, delay: number = 60) => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = undefined
      expandMore.value = newV
    }, delay)
  }

  watch(() => props.isMouseEnter, (newV) => {
    // console.log("isMouseEnter............", newV)
    if(newV) {
      setExpandMore(true)
      return
    }
    if(isMenuShow) return
    setExpandMore(false, 400)
  })

  const marginBlockStart = computed(() => {
    const { images, files } = props.cs
    if(images?.length || files?.length) {
      return `4px`
    }
    return `10px`
  })

  const footerMenu = computed<CcToolbarMenuItem[]>(() => {
    const isMine = props.cs.isMine
    if(isMine) return [...MENU_1]
    return [...MENU_2]
  })


  const onMenuShow = () => {
    // console.log("menu show...............")
    isMenuShow = true
  }

  const onMenuHide = () => {
    // console.log("menu hide...............")
    isMenuShow = false
    if(!props.isMouseEnter && !isMobile) setExpandMore(false, 400)
  }


  return {
    marginBlockStart,
    footerMenu,
    expandMore,
    onMenuShow,
    onMenuHide,
  }
}