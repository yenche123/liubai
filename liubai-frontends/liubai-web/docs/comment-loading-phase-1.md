# 评论区渐进式迁移：第一阶段实施报告

日期：2026-10-07

## 本阶段目标

第一阶段只稳定现有评论加载链路，不改公共滚动容器、不改后端 wire protocol、不引入虚拟列表。

覆盖两种场景：

- `CommentArea`：已知动态，向下加载一级评论；
- `CommentDetail`：已知目标评论，加载祖先链、目标评论和回复列表。

## 已实施内容

### 1. 防止同方向重复加载

`CommentDetail` 增加了 `loadingAbove` 和 `loadingBelow`：

- 顶部加载未完成时，新的顶部触发会被忽略；
- 底部加载未完成时，新的底部触发会被忽略；
- 到达边界后仍沿用原有 `hasReachedTop` / `hasReachedBottom` 状态。

`CommentArea` 增加了 `loading`，避免触底、下拉刷新和共享滚动事件同时触发重复请求。

### 2. 隔离目标切换后的旧请求

`CommentDetail` 和 `CommentArea` 都增加了加载代次：

- 切换目标评论或 thread 时，代次递增；
- 每个异步步骤返回后检查代次；
- 旧目标的本地查询、云端同步、内容补全和子评论加载不会再回写到当前界面。

这解决了快速切换评论时旧请求覆盖新内容的问题。

### 3. 为评论建立稳定 DOM 标识

`CommentCard` 根节点现在带有：

- `data-comment-id`：评论的当前 ID；
- `data-comment-key`：评论的稳定本地键，用于滚动锚点；
- `data-target-comment="true"`：目标评论标记。

这为后续的目标定位、滚动锚点恢复和可见评论追踪提供了稳定入口。

### 4. 向上插入祖先评论时改用 ID 锚点

`CommentDetail` 原先的 `fixPosition()` 依赖 `scrollHeight` 差值，并等待完整一帧后再补偿滚动位置。现在改为：

1. 插入祖先评论前，找到当前视口内第一条可见评论；
2. 记录评论 ID 和它相对滚动容器顶部的偏移；
3. 修改 `aboveList` 或插入 thread；
4. 等 Vue 完成 DOM 更新；
5. 找回同一条评论，并在下一次绘制前修正滚动位置。

这样补偿基于用户正在阅读的评论，而不是依赖整个列表高度差，减少了插入旧内容时的跳变风险。

### 5. 第一阶段审查修补

针对并发审查又做了几项修正：

- `reload=true` 不再被正在进行的加载静默丢弃，而是使当前方向的请求代次失效并启动新的加载；
- `CommentDetail` 的顶部、底部加载使用独立代次，刷新一侧不会取消另一侧；
- thread 的锚点在异步读取完成后才捕获，避免把用户自己的滚动误判成布局变化；
- 删除旧 `fixPosition` 留下的额外一帧等待；
- 目标评论未命中本地缓存时不再直接读取空对象的 `parentThread`；
- 云端刷新 thread 时统一使用 `parentThread` 查找 thread。

## 暂未处理的内容

以下内容留到后续阶段：

- `IntersectionObserver` 顶部、底部 sentinel；
- `ResizeObserver` 处理图片、展开内容和字体导致的二次高度变化；
- `around(commentId)` 上下文接口；
- 后端 cursor 协议；
- 虚拟列表；
- 修改公共 `ChatScroll` 和 `ScrollView` 的方向判断。

当前的 `CommentDetail` 仍保留原来的共享滚动事件触发方式，以降低迁移风险。

## 验证结果

已运行：

```text
cd liubai-frontends/liubai-web && bun run build
```

结果：通过 `vue-tsc --noEmit` 和 Vite 生产构建。构建过程中保留了项目原有的资源解析提示和插件性能提示，没有新增编译错误。

另外运行了 `git diff --check`，没有发现空白错误。

同时运行了：

```text
cd liubai-frontends/liubai-web && bun run test
```

结果：3 个测试文件、20 个测试全部通过。

## 建议的下一阶段

下一阶段建议先加 `ResizeObserver` 和可见锚点监控，再引入顶部、底部 sentinel。这样可以在不改变现有滚动容器的情况下，逐步替换共享滚动事件的分页触发逻辑。
