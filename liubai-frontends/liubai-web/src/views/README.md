# Views

views 文件夹放一些 layout 相关的条条框框，也就是各式各样的 "容器"。

具体的动态内容，除了 side-bar，其余的都会回到有 `<slot />` 标签回到各自的 pages 下去实现

`side-bar`: 侧边栏，左边的部分

`main-view`: 主视图，中间的部分

`vice-view`: 右边栏，右边的部分，主要存放详情和 iframe

## 宽度关系变化图

变化分三种:

1. 窗口改变: 各个 `main-view` 和 `vice-view` 都要变化

2. 用户拖动 `side-bar`: 各个 `main-view` 和 `vice-view` 都要变化

3. 用户拖动 `vice-view`: 仅当前 `main-view` 和 `vice-view` 要变化


对 `main-view` 来说，变化有：

1. 全局窗口改变

2. 全局用户拖动 `side-bar`

3. 当前分页的 `vice-view` 被拖动

全局窗口的改变，交给 side-bar 去监听

1 和 2 都用 store 监听，回调函数里能得知 `变化事件 (windowChange / sidebarChange)`、`sidebarWidth` 和 `窗口大小 (clientWidth / clientHeight)`

对 `vice-view` 来说，外部变化有：

1. 全局窗口改变

2. 全局用户拖动 `side-bar`: 只会修改 vice-view 的 min & max