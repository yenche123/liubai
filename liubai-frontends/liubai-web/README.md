# LB

Build! Anyway

使用 `API_DOMAIN` 环境变量，代表后端应用的访问地址
重新审视，`limit.getMode` 的作用

## 开发备注

1. Web Worker 与主进程相比，是新开一个线程的意思。也就是说，在主线程里使用到的文件和变量，若已赋过值值，在 web worker 中仍然是没有被赋值的情况，这要格外注意！！！！
   
2. Web Worker 中也访问不到 window 这个全局变量，也访问不到 localStorage

3. `mobile-kanban` 分支，对于移动设备，看板里的卡片是整个可以拖动的，而不像原来只能触摸右小角 6 点点来拖动；但由于没有 ipad 在身边，未经测试，故没有合并到 `main` 分支中。

4. 切换 enable / show 时，若该组件全局只有一个，那么可以使用 toggleTimeout，否则多个实例共用同一个 toggleTimeout，状态就乱了。

5. `liuUtil.check.hasEverSynced` 很实用，能检测该数据是否同步过

6. 网站性能测试: https://www.webpagetest.org/

7. Safari “加入 Dock 中”，会优先使用 `manifest` 定义的 512x512 并且 purpose 为 `maskable` 的图标，但这个图标由于最小安全区域的缘故，图标是大量留白的，这时添加到 Dock 中其图标会变得很小，所以干脆不存放 512 这个尺寸的 maskable 图标至 manifest 中，而是在这个尺寸时，统一使用背景透明的 any 图标，但是 purpose 中也填上 `maskable`，即
```json
{
  "src": "logos/logo_512x512_v2.png",
  "sizes": "512x512",
  "type": "image/png",
  "purpose": "any maskable"
}
```

## 彻底解决 pnpm 网络请求超时的问题

关闭 ipv6! 改为 `仅本地连接`
关闭 ipv6! 改为 `仅本地连接`
关闭 ipv6! 改为 `仅本地连接`

清除 pnpm 缓存: `pnpm store prune`

pnpm 设置代理: `pnpm config set proxy socks5://127.0.0.1:1081`

查看 pnpm 配置: `pnpm config list`

## PWA

### 图标优先级
根据经验，PWA 各个操作系统和浏览器如何优先取图标：

#### Android Chrome

根据 manifest.json，选取 sizes 为 256x256，再从中选取 purpose 含有 `maskable` 的元素，并且排列越靠前的越优先选取。

注意: Android Chrome，会对透明背景涂黑，并且会裁切至最小安全区域（minimum safe area），见 https://maskable.app/

更奇怪的是，Android 上操作系统自动裁切时的形状竟然不是圆形，而是一个大圆角的矩形。

#### iPhone Safari
根据 index.html 中的 `<link rel="apple-touch-icon">` 标签取值。同样地，这组系统也会对背景做涂黑处理。

#### MacOS Chrome
根据 manifest.json，选取 sizes 为 256x256，再依据 purpose: `any maskable` > `maskable`

#### MacOS Safari
根据 manifest.json，选取 sizes 为 512x512，再依据 purpose: `maskable` > `any maskable`。这组系统会略微缩小原图（不会缩小至“最小安全区域”那么多，目测只缩小了 90%），居中后把剩余的背景涂白处理。

上方 MacOS 以 MacBook Air M2 为例。

### 图标适配的网站

图标适配，有以下网站可以参考:

1. https://maskable.app/editor
2. https://favicon.inbrowser.app/tools/favicon-generator
3. https://realfavicongenerator.net/

### workbox-window

若 VitePWA 的配置项 devOptions.enable 为 `true` 时，请安装 `devDependencies` 开发依赖 `workbox-window` 否则会报错；另外，当开启这个选项时，无法使用热更新。


## 前后端同步原则

### 要求实时联网
修改工作区名称（头像）、成员昵称（头像）、新建工作区、加入工作区、删除工作区、退出工作区，这些频率低的操作，全部要求实时联网。

### 支持断网操作
新建动态（含评论）、删除动态、编辑动态、编辑标签、编辑状态（指 workspace 的那个 stateConfig），都要支持断网操作、联网后同步。


## 图标库

https://github.com/microsoft/fluentui-emoji/tree/main

https://fonts.google.com/icons

https://www.svgrepo.com/

https://icons.radix-ui.com/

https://www.iconfinder.com/

https://iconbuddy.app/

https://svgmix.com/

https://yesicon.app/

https://emojis.alexandru.so/  AI 生成 emoji

https://www.bing.com/images/create  用 DALL-E 3 生成插图

https://openmoji.org/

https://svgl.app/   收录各品牌的 logo

https://remixicon.com/

https://www.logo.dev/ 同样收录各个品牌的 logo


## 一些常用碎片

1. `vc-` 开头的 css 类名，会跟 `vconsole` 库的样式冲突，请避免使用。

2. 升级 tiptap 下的依赖至最新，使用 `pnpm up "@tiptap/*" --latest`

3. 函数式获取应用个人信息（userId / memberId / spaceId / spaceType）上下文，使用 `checker.getMyContext()` 

4. 使用 `umami.is` 的网站分析服务时，若出现官网打不开关于 `net::ERR_BLOCKED_BY_CLIENT` 的错误，那说明被浏览器的 AdBlock 插件拦截了，打开插件的 `Pause on this site` 选项即可。

5. `props` 有属性 `a` 是 `required: true` 时，不可以把 `props` 声明在 `types.ts` 文件里，因为 `.vue` 文件在 IDE 里读取时，会把 props 的实例读成类型的形式，这时会将 `a` 看成 `required: boolean` 而非 `required: true`，导致 TS 把 `props.a` 视作有可能为 `undefined`，造成后续编写代码需要多判断空值的问题。

6. 定期执行 `pnpm run build` 虽然我们在开发时，运行 `pnpm run dev` 即可进行调试或预览，但是最终交给用户的代码依然需要运行前者这样的命令，若最终打包时出现大面积错误，修改起来会很痛苦，所以建议定期执行该命令，确保你所写的代码都能成功打包。

7. Keyboard Info: https://www.toptal.com/developers/keycode 可以查看键盘 keyboard 的 key

8.  在路由里 `cid` 已经被拿来作为 `threadId` 的昵称，那么姑且就用 `cid2` 作为 `commentId` 的昵称

9.  升级 `pdf-js` 的流程: 将分支切换到 `pdfjs` 上，删除所有 `public/lib/pdf-js` 下的文件，再黏贴最新的文件进该文件夹里，提交 `commit`；再切回 `main` 分支，运行 `git checkout -b dev-pdfjs`，然后再运行 `git merge pdfjs`，解决冲突、运行代码，确认都没问题后，再把 `dev-pdfjs` 合并进 `main`，最后再删除 `dev-pdfjs` 分支

10. “新建工作区”“加入工作区”“退出工作区”“会修改到 User 表” 的操作，不要使用 sync-set 同步接口，因为这个操作影响太大了，若联网后云端拒绝创建，存在里头的动态和评论怎么办？会非常难处理。

11. 使用 https://npmgraph.js.org/ 查看依赖关系图

12. 使用 `where node` 得知 `node` 的安装路径

13. 只要 `云端` 和 `前端` 的数据结构（类型）有一丁点不一样，就必须使用不同的名称，以避免混淆。

14. `Enter` 的符号: ↵

15. 一大坑点，关于密文的生成和解密，在 Node.JS 环境里请在 `Buffer` 域进行操作，比如 `Buffer` 域的加法为 `Buffer.concat(Buffer.from(bufferA, 'base64'), Buffer.from(bufferB))`。它与 `base64` 域的字符串的加减乘除运算，完全不等价！！！

16. 同步问题: 考虑放弃 `cloud_id` 改用 `first_id`，用后者表示本地创建时用的 `id`。若动态是在云端被创建的，比如第三方传递过来的，就将 `first_id` 设为与 `_id` 同值即可。视图层上 `v-for` 的 :key 全部使用 `first_id` 这样就不会有 `_id` 发生变化 `thread-card` 组件被销毁重建的问题了。

17. 运行 `pnpm` 遭遇 `WARN GET https://registry.npmjs.org/依赖名称 error (ERR_SOCKET_TIMEOUT). Will retry in 10 seconds. 2 retries left` 的错误，这时可以打开 `WiFi-设置`，`详细资讯 - TCP/IP`，把设定 IPv6 切换成 `仅本地连接`，确定后再改回 `自动`，再重新运行一次 `pnpm` 看是否恢复，详见 https://github.com/pnpm/pnpm/issues/6434#issuecomment-1937315051

18. 配置命令行的代理，以 MacOS 为例参考: https://fortune-sneeze-ade.notion.site/62baeed105624c6097f8983b4e462a9d?pvs=4

19. 运行 `curl cip.cc` 查看当前命令行设置的代理

20. 一个使用 Rust 编写的 node.js 版本管理工具 `fnm`，安装好后在项目根目录下运行 `eval "$(fnm env --use-on-cd)"` （以 MacOS 为例）开始使用，运行 `fnm current` 查看当前项目使用的 node.js 版本号。若全局电脑只想使用 LTS 的 node.js，那么是不需要使用 `fnm` 的，只要在 node.js 官网下载（升级时亦然）并安装即可。

21. pnpm v9 起，可使用 `pnpm licenses list` 打印当前目录下所有第三方依赖的许可证信息

22. 若使用 homebrew 安装 pnpm，后续升级时也请使用 homebrew 的命令 `brew upgrade pnpm`；使用 `brew outdated` 可以查看 homebrew 安装的软件有哪些需要升级。

23. 使用 css 作画 https://css-shape.com/

24. The CHANGELOG of Bugfender is on https://bugfender.releasenotes.io/

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


## 第一次配置 MacOS

1. 安装 `node.js`，里头含了 `npm`。运行 `node -v` 和 `npm -v` 检查。
https://nodejs.org/en

2. 安装 `vs-code`
https://code.visualstudio.com

3. 安装 `homebrew`，为了后续安装 `pnpm`

4. 安装 `pnpm`，安装完运行 `pnpm -v` 检查
https://brew.sh/

5. 安装 `cdto`，用于在 Finder 里，打开某个文件夹后，快速启动 Terminal
教程: https://blog.csdn.net/Jason_WangYing/article/details/115400785
安装: https://github.com/jbtule/cdto/releases

6. MacOS 出厂时即安装了 `Git`，但仍然可运行 `brew install git` 升级 `Git`。装完后重新启动 Terminal 再运行 `git --version` 查看是否更新到最新版

7. 打开 `VS-Code`，点击 `Command + Shift + P` 输入 `shell`，点击 `Install 'code' command in PATH`，之后重新启动电脑。

8. 检查是否有 ssh: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/checking-for-existing-ssh-keys
若没有，在本地生成 ssh: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent
把本地的 ssh 公钥填入 GitHub 中: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account

9. 在 Finder 合适的位置中，比如 `/Users/你的用户名` 中，创建一个文件夹 `Dev`。之后点击右上角由第 5 步安装的 `cdto` 打开 Terminal，此时再运行 `git clone 你的仓库地址`。代码下载完成后，`cd 你的项目名`，再运行 `code .` 即可开始编写代码啦！

10. 开启 vite dev server 时，当要用手机调试时，必须现在电脑上开启 Network 的地址，手机才打得开同一个地址。


### MacOS 中的注意事项

只有在 Eng 输入法时（中文无效），敲击 Control + ` 才会打开 vs-code 中的终端
