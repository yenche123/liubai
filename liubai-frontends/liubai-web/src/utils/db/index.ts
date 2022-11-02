import Dexie, { Table } from 'dexie';

/**
 * 注意：
 *   1. 只在已有的 interface CustomTable 里新增 数据类型，并不需要提升 version
 *   2. 唯有 新增数据表（objectStore），或者 修改索引时，需要提升 version
 *   3. 没有在 this.version(3).stores() 里定义的数据表，会被删除（以前定义过，后来移除了，就会被删除）
 *   4. 只提升 version 并不会造成原有数据丢失，除非 this.version(3).stores() 里头没有定义了
 */

export interface Table1 {
  id?: number
  name: string
  age: string
  gender?: 0 | 1
  nickName?: string
}

export interface Table2 {
  id?: number
  keyA: string
  keyB: number
}


export class LiuDexie extends Dexie {

  table2!: Table<Table2>

  constructor() {
    super('LiubaiDatabase')
    this.version(3).stores({
      table2: "++id, keyA, name, age, gender"
    })
  }

}

export const db = new LiuDexie()