# Views

## 宽度关系变化图

变化分三种:

1. 窗口改变: 各个 `main-view` 和 `detail-view` 都要变化

2. 用户拖动 `side-bar`: 各个 `main-view` 和 `detail-view` 都要变化

3. 用户拖动 `detail-view`: 仅当前 `main-view` 和 `detail-view` 要变化


对 `main-view` 来说，变化有：

1. 全局窗口改变

2. 全局用户拖动 `side-bar`

3. 当前分页的 `detail-view` 被拖动

全局窗口的改变，交给 side-bar 去监听

1 和 2 都用 store 监听，回调函数里能得知 `变化事件 (windowChange / sidebarChange)`、`sidebarWidth` 和 `窗口大小 (clientWidth / clientHeight)`

对 `detail-view` 来说，外部变化有：

1. 全局窗口改变

2. 全局用户拖动 `side-bar`: 只会修改 detail-view 的 min & max