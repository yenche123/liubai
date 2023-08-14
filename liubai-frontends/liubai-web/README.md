# LB

I love it, this job!!

## 开发备注

1. `mobile-kanban` 分支，对于移动设备，看板里的卡片是整个可以拖动的，而不像原来只能触摸右小角 6 点点来拖动；但由于没有 ipad 在身边，未经测试，故没有合并到 `main` 分支中。


## 图标库

https://fonts.google.com/icons

https://www.svgrepo.com/

https://icons.radix-ui.com/

https://www.iconfinder.com/

https://iconbuddy.app/

https://svgmix.com/

## 一些常用碎片

1. `vc-` 开头的 css 类名，会跟 `vconsole` 库的样式冲突，请避免使用。

2. `Volar Takeover Mode`: Vue 的单文件组件 SFCs (即 `.vue` 文件) 与 TS 一同工作时，会开启一个 TS language service 的实例，而原本的 `.ts` 文件则由 VS Code 内置的 TS language service 实例处理。一个项目里两个实例可能会引发性能问题，因此 Volar 提供 `Takeover 模式` 以同时支持两种文件，解决性能问题。
   打开方式: `Ctrl + Shift + P`，输入 `built` 选择 `Extensions: Show Built-in Extensions`，在搜索框再输入 `typescript`（不要移除 `@builtin` 前缀），点击 `TypeScript and JavaScript Language Features` 的齿轮（设置）图标，选择 `Disable (Workspace)`，重新打开 VS Code 即完成设置。

3. 开源前，记得移除 `.vscode/settings.json` 里的 `typescript.tsdk`

4. 升级 tiptap 下的依赖至最新，使用 `pnpm up @tiptap/* --latest`

5. 函数式获取应用个人信息（userId / memberId / spaceId / spaceType）上下文，使用 `checker.getMyContext()` 

6. 使用 `umami.is` 的网站分析服务时，若出现官网打不开关于 `net::ERR_BLOCKED_BY_CLIENT` 的错误，那说明被浏览器的 AdBlock 插件拦截了，打开插件的 `Pause on this site` 选项即可。

7. `props` 有属性 `a` 是 `required: true` 时，不可以把 `props` 声明在 `types.ts` 文件里，因为 `.vue` 文件在 IDE 里读取时，会把 props 的实例读成类型的形式，这时会将 `a` 看成 `required: boolean` 而非 `required: true`，导致 TS 把 `props.a` 视作有可能为 `undefined`，造成后续编写代码需要多判断空值的问题。

8. 定期执行 `pnpm run build` 虽然我们在开发时，运行 `pnpm run dev` 即可进行调试或预览，但是最终交给用户的代码依然需要运行前者这样的命令，若最终打包时出现大面积错误，修改起来会很痛苦，所以建议定期执行该命令，确保你所写的代码都能成功打包。

9. Keyboard Info: https://www.toptal.com/developers/keycode 可以查看键盘 keyboard 的 key

10. 在路由里 `cid` 已经被拿来作为 `threadId` 的昵称，那么姑且就用 `cid2` 作为 `commentId` 的昵称

11. 升级 `pdf-js` 的流程: 将分支切换到 `pdfjs` 上，删除所有 `public/lib/pdf-js` 下的文件，再黏贴最新的文件进该文件夹里，提交 `commit`；再切回 `main` 分支，运行 `git checkout -b dev-pdfjs`，然后再运行 `git merge pdfjs`，解决冲突、运行代码，确认都没问题后，再把 `dev-pdfjs` 合并进 `main`，最后再删除 `dev-pdfjs` 分支

12. 运行 `pnpm outdated` 能检查项目中使用到的依赖是否有需要更新的

## 评论

`一级评论`: 严格定义为直接回复动态的评论，也就是其 `parentComment` 和 `replyToComment` 属性值皆为空。

`二级评论`: 严格定义为回复一级评论的评论，这种评论其 `parentComment` 和 `replyToComment` 属性值皆有值且相同

`n级评论`: 严格定义为回复 `n-1` 级的评论，其中 n >= 3。这种评论，其 `replyToComment` 为其 `n-1` 级评论的 `_id`，而 `parentComment` 为其 `n-1` 级评论的 `replyToComment`

`parentThread`: 所有的评论都必须有该值，用于表示该评论在哪条动态下

`parentComment`: 所有直接回复动态的评论 (即一级评论) 都 **没有** 该属性值，二级及以上的评论都有该值

`replyToComment`: 表示回复哪条评论，所有二级及以上的评论都必须有该值。

`主评论`: 一级评论

`子评论`: 二级及其以上的评论

### 新增回复 / 删除回复

1. 新增子评论 a 时，被回复的那一条 comment (即 a 的 `replyToComment`) 的 `commentNum` 自动 +1，同时 a 的 `parentThread` 的 `commentNum` 也自动 +1。若 a 的 `parentComment` 与 `replyToComment` 不一致时，也把 `parentComment` 的 `commentNum` 自动 +1
2. 删除同理，当 a 被删除时，将它的 `replyToComment` 的 `commentNum` 自动 -1，同时把 a 的 `parentThread` 的 `commentNum` 也自动 -1。若 a 的 `parentComment` 与 `replyToComment` 不一致时，也把 `parentComment` 的 `commentNum` 自动 -1 


