// 整个网页启动后
// 并且等待 route.name 有值，且在 "应用内"（即 inApp 不为 false）时
// 执行一些系统操作：
// 1. 将超过 7 天且为 DELETED 的 contents 都给删除
// 2. 将超过 30 天且为 REMOVED 的 contents 调整为 DELETED

// 删除完后，不需要用 useThreadShowStore 通知各组件
// 因为各组件都不应显示出过期并且已删除的数据

import { useEnterIntoApp } from "~/hooks/useEnterIntoApp";

export function initCycle() {

  useEnterIntoApp(async () => {

    await handleDeletedContents()
    await handleRemovedContents()

  })

}

// 将超过 7 天且为 DELETED 的 contents 都给删除
// 只加载最旧的 50 条
async function handleDeletedContents() {

}

// 将超过 30 天且为 REMOVED 的 contents 调整为 DELETED
async function handleRemovedContents() {

}