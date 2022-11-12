
import type { InjectionKey, Ref } from 'vue'

// InjectionKey 是什么? 参考: 
// https://cn.vuejs.org/guide/typescript/composition-api.html#typing-provide-inject

export const vvKey = Symbol() as InjectionKey<Ref<number>>
export const mvKey = Symbol() as InjectionKey<Ref<number>>

// 用于拖动掉落文件
export const mvFileKey = Symbol() as InjectionKey<Ref<File[]>>

// 用于 initCeState 告知富文本编辑器 editor-core 有置入文本信息
// 每次触发置入时，对应的 number += 1
export const editorSetKey = Symbol() as InjectionKey<Ref<number>>