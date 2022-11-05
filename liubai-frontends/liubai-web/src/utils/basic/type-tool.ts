/**
 * 把类型 T 中 特定的属性 K们 设置为可选的
 */
 export type PartialSth<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

 /**
  * 把类型 T 中 特定的属性 K们 设置为必选的
  */
 export type RequireSth<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
 
 
 