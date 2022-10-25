
import type { InjectionKey, Ref } from 'vue'

// InjectionKey 是什么? 参考: 
// https://cn.vuejs.org/guide/typescript/composition-api.html#typing-provide-inject

export const vvKey = Symbol() as InjectionKey<Ref<number>>