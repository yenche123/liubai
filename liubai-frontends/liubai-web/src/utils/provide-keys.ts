
import type { InjectionKey, Ref, ShallowRef } from 'vue'
import type { SvProvideInject, SvBottomUp } from "../components/common/scroll-view/tools/types"

// InjectionKey 是什么? 参考: 
// https://cn.vuejs.org/guide/typescript/composition-api.html#typing-provide-inject

export const viceViewWidthKey = Symbol() as InjectionKey<Ref<number>>
export const mainViewWidthKey = Symbol() as InjectionKey<Ref<number>>

// 在 main-view 里面，就等于 mainViewWidthKey; 在 vice-view 里面就等于 viceViewWidthKey
export const outterWidthKey = Symbol() as InjectionKey<Ref<number>>

// 用于拖动掉落文件
export const mvFileKey = Symbol() as InjectionKey<Ref<File[]>>

// 用于 initCeState 告知富文本编辑器 editor-core 有置入文本信息
// 每次触发置入时，对应的 number += 1
export const editorSetKey = Symbol() as InjectionKey<Ref<number>>

// 用于跨级传递 scroll-view 的事件 (触底和触顶) 被触发
export const scrollViewKey = Symbol() as InjectionKey<SvProvideInject>

// 用于跨级传递 scroll-view scolling 事件
export const svScollingKey = Symbol() as InjectionKey<Ref<number>>

// 用于让子/孙组件传递参数给 scroll-view 让后者滚动到特定位置
export const svBottomUpKey = Symbol() as InjectionKey<ShallowRef<SvBottomUp>>
